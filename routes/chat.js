import { generateCacheKey, cacheResponse, getCachedResponse, shouldCache } from '../utils/cache.js';
import { convertImageToDataURL } from '../utils/converters.js';
import {
	processFunctionMessages,
	addFunctionContext,
	parseFunctionCall,
	formatFunctionCallResponse,
} from '../utils/functionCalling.js';
import {
	MODEL_CATEGORIES,
	DEFAULT_MODELS,
	MODEL_CONTEXT_WINDOWS,
	MODEL_CAPABILITIES,
} from '../utils/models.js';
import { processThink } from '../utils/format.js';

// Helper function to process messages with potential image content
async function processMultimodalMessages(messages) {
	return Promise.all(
		messages.map(async message => {
			// If content is a string, return as is
			if (typeof message.content === 'string') {
				return message;
			}

			const processItem = async item => {
				if (item.type === 'text') {
					return item;
				}

				if (item.type === 'image_url') {
					if (typeof item.image_url?.url === 'string') {
						// Handle data URLs directly
						if (item.image_url.url.startsWith('data:')) {
							return item;
						}
						// Handle HTTP/HTTPS URLs by fetching and converting to data URL
						else if (item.image_url.url.startsWith('http')) {
							try {
								// Validate the URL before fetching
								new URL(item.image_url.url);

								const dataUrl = await convertImageToDataURL(item.image_url.url);
								return {
									type: 'image_url',
									image_url: {
										url: dataUrl,
									},
								};
							} catch (error) {
								console.error('Error fetching image URL:', error);
								throw new Error('Image URL must be a data URI or a valid HTTP/HTTPS URL.');
							}
						}
					}
					throw new Error('Image URL must be a data URI or a valid HTTP/HTTPS URL.');
				}
				return item;
			};

			// If content is an array, process each item
			if (Array.isArray(message.content)) {
				const processedContent = await Promise.all(message.content.map(processItem));
				return {
					...message,
					content: processedContent,
				};
			}

			// Handle object content with type property
			if (typeof message.content === 'object' && message.content !== null) {
				const processedContent = await processItem(message.content);
				return {
					...message,
					content: processedContent,
				};
			}

			return message;
		}),
	);
}

export const chatHandler = async (request, env) => {
	let model = '@cf/meta/llama-4-scout-17b-16e-instruct'; // Default model
	let messages = [];

	// get the current time in epoch seconds
	const created = Math.floor(Date.now() / 1000);
	const uuid = crypto.randomUUID();

	try {
		// If the POST data is JSON then attach it to our response.
		if (request.headers.get('Content-Type') === 'application/json') {
			const json = await request.json();

			// Handle model selection - use real Cloudflare model names directly
			if (json?.model) {
				// Use supported Cloudflare models from unified configuration
				const supportedModels = MODEL_CATEGORIES.chat;

				// Check if the provided model is supported
				if (supportedModels.includes(json.model)) {
					model = json.model;
				} else {
					throw new Error(
						`Unsupported model: ${json.model}. Supported models: ${supportedModels.join(', ')}`,
					);
				}
			} else {
				// Use default model if none provided
				model = DEFAULT_MODELS.chat;
			}

			if (json?.messages && Array.isArray(json.messages) && json.messages.length > 0) {
				messages = json.messages;
			} else {
				return Response.json(
					{
						error: {
							message: 'messages are required and must be a non-empty array',
							type: 'invalid_request_error',
							code: 'invalid_request',
						},
					},
					{ status: 400 },
				);
			}

			if (!json?.stream) json.stream = false;

			// Get model configuration and context window
			const context_window = MODEL_CONTEXT_WINDOWS[model];

			// Handle max_tokens parameter with reasonable defaults and limits
			// Always use a numeric value (never undefined or null) for max_tokens
			let max_tokens = 1024; // Fallback default

			// If max_tokens is specified in the request and is a valid number, use it
			if (typeof json.max_tokens === 'number' && json.max_tokens > 0) {
				max_tokens = Math.min(json.max_tokens, context_window); // Don't exceed context window
			} else {
				// Otherwise calculate a default based on model's context window
				max_tokens = Math.floor(context_window * 0.7); // Use 70% of context window by default
			}

			// Ensure max_tokens is at least 10 tokens
			max_tokens = Math.max(10, max_tokens);

			// Handle other generation parameters
			const temperature =
				json?.temperature && typeof json.temperature === 'number'
					? Math.max(0, Math.min(json.temperature, 2)) // Clamp between 0 and 2
					: 0.7; // Default temperature

			const topP =
				json?.top_p && typeof json.top_p === 'number'
					? Math.max(0, Math.min(json.top_p, 1)) // Clamp between 0 and 1
					: 0.9; // Default top_p

			// Handle function calling
			let tools = null;
			let toolChoice = null;
			if (json?.tools && Array.isArray(json.tools)) {
				tools = json.tools;
				toolChoice = json?.tool_choice || 'auto';

				// Validate tool definitions
				for (const tool of tools) {
					if (tool.type !== 'function') {
						throw new Error(`Unsupported tool type: ${tool.type}. Only 'function' is supported.`);
					}
					if (!tool.function?.name) {
						throw new Error('Tool function must have a name');
					}
				}
			}

			// Legacy function calling support
			if (json?.functions && Array.isArray(json.functions)) {
				// Convert legacy functions to tools format
				tools = json.functions.map(func => ({
					type: 'function',
					function: func,
				}));
				toolChoice = json?.function_call || 'auto';
			}

			// Log parameters for debugging
			console.log('AI Parameters:', {
				model,
				max_tokens,
				temperature,
				topP,
				messageCount: messages.length,
				streaming: json.stream,
				toolsCount: tools?.length || 0,
				toolChoice,
			});

			let buffer = '';
			const decoder = new TextDecoder();
			const encoder = new TextEncoder();
			let isFinished = false;
			let pastThinkTag = false; // New state variable
			const thinkTagEnd = '</think>';

			const transformer = new TransformStream({
				transform(chunk, controller) {
					if (isFinished) return;

					buffer += decoder.decode(chunk);

					if (!pastThinkTag) {
						const thinkIndex = buffer.indexOf(thinkTagEnd);
						if (thinkIndex !== -1) {
							// Found the tag, trim the buffer and proceed
							buffer = buffer.substring(thinkIndex + thinkTagEnd.length);
							pastThinkTag = true;
						} else {
							// Tag not found yet, keep buffering and don't send anything
							return;
						}
					}

					// Process buffered data and try to find the complete message
					while (true) {
						const newlineIndex = buffer.indexOf('\n');
						if (newlineIndex === -1) {
							// If no line breaks are found, it means there is no complete message, wait for the next chunk
							break;
						}

						// Extract a complete message line
						const line = buffer.slice(0, newlineIndex + 1);
						buffer = buffer.slice(newlineIndex + 1); // Update buffer

						// Process this line
						try {
							if (line.startsWith('data: ')) {
								const content = line.slice('data: '.length);
								const doneflag = content.trim() == '[DONE]';
								if (doneflag) {
									// Send final chunk with finish_reason
									const finalChunk =
										'data: ' +
										JSON.stringify({
											id: uuid,
											created,
											object: 'chat.completion.chunk',
											model: json.model || model,
											choices: [
												{
													delta: {},
													index: 0,
													finish_reason: 'stop',
												},
											],
										}) +
										'\n\n';
									controller.enqueue(encoder.encode(finalChunk));
									controller.enqueue(encoder.encode('data: [DONE]\n\n'));
									isFinished = true;
									return;
								}

								const data = JSON.parse(content);
								if (data.response) {
									// Debug OSS model streaming responses
									if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
										console.log('[OSS Model Stream] Response chunk type:', typeof data.response);
										if (typeof data.response === 'object' && data.response !== null) {
											console.log(
												'[OSS Model Stream] Response chunk keys:',
												Object.keys(data.response),
											);
										}
									}

									// For OSS models, extract the actual text response instead of JSONifying the whole data object
									// The response field contains the actual text content we need to send to the client
									const actualContent =
										typeof data.response === 'string'
											? data.response
											: data.response?.text ||
												data.response?.content ||
												JSON.stringify(data.response);

									// Log a sample of what we're sending back
									if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
										console.log(
											'[OSS Model Stream] Extracted content:',
											actualContent.length > 50
												? actualContent.substring(0, 50) + '...'
												: actualContent,
										);
									}

									const newChunk =
										'data: ' +
										JSON.stringify({
											id: uuid,
											created,
											object: 'chat.completion.chunk',
											model: json.model || model,
											choices: [
												{
													delta: {
														role: 'assistant',
														content: actualContent,
													},
													index: 0,
													finish_reason: null,
												},
											],
										}) +
										'\n\n';
									controller.enqueue(encoder.encode(newChunk));
								}
							}
						} catch (err) {
							console.error('Error parsing streaming line:', err);
						}
					}
				},

				flush(controller) {
					// Ensure stream ends properly if not already finished
					if (!isFinished) {
						const finalChunk =
							'data: ' +
							JSON.stringify({
								id: uuid,
								created,
								object: 'chat.completion.chunk',
								model: json.model || model,
								choices: [
									{
										delta: {},
										index: 0,
										finish_reason: 'stop',
									},
								],
							}) +
							'\n\n';
						controller.enqueue(encoder.encode(finalChunk));
						controller.enqueue(encoder.encode('data: [DONE]\n\n'));
					}
				},
			});

			// Prepare AI parameters
			let processedMessages = messages;
			const aiParams = {
				stream: json.stream,
				max_tokens,
				temperature,
				topP,
			};

			// Log the parameters we're passing to ensure they're correct
			console.log('AI Parameters being sent:', {
				model,
				max_tokens: aiParams.max_tokens,
				temperature: aiParams.temperature,
				topP: aiParams.topP,
			});

			// Store original messages before any processing that might be skipped
			const originalMessages = [...messages];

			// Process messages for multimodal content
			processedMessages = await processMultimodalMessages(originalMessages);

			// Determine if the model supports function calling
			const modelSupportsFunctionCalling = MODEL_CAPABILITIES[model]?.includes('function-calling');

			// Handle function calling logic
			if (tools) {
				if (modelSupportsFunctionCalling) {
					// Convert function calling messages to a format Cloudflare Workers AI understands
					processedMessages = processFunctionMessages(processedMessages, tools);
					processedMessages = addFunctionContext(processedMessages, tools);
				} else {
					// If tools are provided but the model doesn't support function calling,
					// remove tools and toolChoice from parameters and revert messages
					console.warn(`Model ${model} does not support function calling. Ignoring tools.`);
					tools = null;
					toolChoice = null;
					// Revert processedMessages to original (multimodal processed) state
					processedMessages = await processMultimodalMessages(originalMessages, model);
				}
			}

			// Special handling for OpenAI OSS models that require 'input' instead of 'messages'
			if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
				let inputText = '';
				for (const message of processedMessages) {
					if (message.role === 'system') {
						inputText += `[SYSTEM] ${message.content}\n`;
					} else if (message.role === 'user') {
						inputText += `[USER] ${message.content}\n`;
					} else if (message.role === 'assistant') {
						inputText += `[ASSISTANT] ${message.content}\n`;
					}
				}
				aiParams.input = inputText.trim();
				// Ensure tools and toolChoice are not sent for OSS models if they were previously set
				delete aiParams.tools;
				delete aiParams.tool_choice;
			} else {
				aiParams.messages = processedMessages;
				// Add tools and toolChoice to aiParams only if they are still valid
				if (tools) {
					aiParams.tools = tools;
					aiParams.tool_choice = toolChoice;
				}
			}

			// Check cache for non-streaming requests (don't cache function calls)
			let cachedResponse = null;
			let cacheKey = null;

			if (env.CACHE_KV && shouldCache(aiParams) && !tools) {
				cacheKey = await generateCacheKey(model, processedMessages, aiParams);
				cachedResponse = await getCachedResponse(env.CACHE_KV, cacheKey);

				if (cachedResponse) {
					console.log('Returning cached response');
					return Response.json({
						...cachedResponse,
						id: uuid, // Use new UUID for each request
						created, // Use current timestamp
					});
				}
			}

			// Clone the aiParams to ensure we don't modify the original object
			const finalParams = { ...aiParams };

			// The Cloudflare backend expects max_tokens to be a valid integer value
			// This is the key fix to address the "Type mismatch of '/max_tokens', 'integer' not in 'null'" error
			if (finalParams.max_tokens === undefined || finalParams.max_tokens === null) {
				// Default to a reasonable value based on model context window
				finalParams.max_tokens = Math.floor(context_window * 0.7);
			}

			// Log the final parameters before running the AI model
			console.log('Running AI model with:', { model, finalParams });
			console.log('Final AI parameters (JSON):', JSON.stringify(finalParams, null, 2));
			// Run the AI model with validated parameters
			const aiResp = await env.AI.run(model, finalParams);

			// Log response info for debugging
			console.log('AI Raw Response:', aiResp);
			if (!json.stream && aiResp.result && aiResp.result.response) {
				console.log('AI Response length:', aiResp.result.response.length);
			}

			// Process OSS model responses specifically (they have a different format)
			let processedResp = aiResp;
			if (
				!json.stream &&
				(model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b')
			) {
				// For OSS models in non-streaming mode, we need to extract the response content
				console.log('[OSS Model] Processing non-streaming response for', model);
				console.log('[OSS Model] Raw response:', JSON.stringify(aiResp));

				// Handle the new response format from Cloudflare's OSS models
				if (typeof aiResp === 'object' && aiResp !== null) {
					// New format has output array with message objects
					if (Array.isArray(aiResp.output)) {
						// Find the message object with type 'message' and role 'assistant'
						const assistantMessage = aiResp.output.find(
							msg => msg.type === 'message' && msg.role === 'assistant',
						);

						if (assistantMessage && Array.isArray(assistantMessage.content)) {
							// Extract text content from the content array
							const textContent = assistantMessage.content
								.filter(item => item.type === 'output_text')
								.map(item => item.text)
								.join('');
							processedResp = textContent || '';
						} else {
							// Look for output_text type objects in the output array
							const outputTextItems = aiResp.output.filter(item => item.type === 'output_text');
							if (outputTextItems.length > 0) {
								// Extract text from output_text items
								const textContent = outputTextItems.map(item => item.text).join('');
								processedResp = textContent || '';
							} else {
								// Fallback to first message content if no assistant message found
								const firstMessage = aiResp.output[0];
								if (firstMessage && Array.isArray(firstMessage.content)) {
									const textContent = firstMessage.content
										.filter(item => item.type === 'output_text')
										.map(item => item.text)
										.join('');
									processedResp = textContent || '';
								} else {
									processedResp = aiResp.text || aiResp.response || '';
								}
							}
						}
					}
					// Handle case where response is directly in aiResp (newer format)
					else if ('response' in aiResp) {
						processedResp =
							typeof aiResp.response === 'string'
								? aiResp.response
								: aiResp.response?.text ||
									aiResp.response?.content ||
									JSON.stringify(aiResp.response);
					} else {
						// Try to extract any text content from the response
						processedResp = aiResp.text || aiResp.response || JSON.stringify(aiResp);
					}
				} else {
					processedResp = aiResp || '';
				}
			}

			// Piping the readableStream through the transformStream
			if (json.stream) {
				return new Response(aiResp.pipeThrough(transformer), {
					headers: {
						'content-type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						'Connection': 'keep-alive',
					},
				});
			} else {
				// Process the response for potential function calls
				// For OSS models, processedResp should already be the content string
				// For other models, it might be the full response object
				let contentToProcess = processedResp;
				if (
					typeof processedResp === 'object' &&
					processedResp !== null &&
					'response' in processedResp
				) {
					contentToProcess = processedResp.response;
				}

				// For OSS models, ensure we're passing just the text content, not the full object
				if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
					// If processedResp is still an object, try to extract the text content
					if (typeof processedResp === 'object' && processedResp !== null) {
						if (Array.isArray(processedResp.output)) {
							// Look for output_text type objects in the output array
							const outputTextItems = processedResp.output.filter(
								item => item.type === 'output_text',
							);
							if (outputTextItems.length > 0) {
								// Extract text from output_text items
								contentToProcess = outputTextItems.map(item => item.text).join('');
							}
						}
					}
				}

				const { hasFunction, functionCall, content } = parseFunctionCall(contentToProcess);

				let response;
				if (hasFunction && tools) {
					// Return function call response
					const message = formatFunctionCallResponse(functionCall, content);
					response = {
						id: uuid,
						model: json.model || model,
						created,
						object: 'chat.completion',
						choices: [
							{
								index: 0,
								message,
								finish_reason: 'tool_calls',
							},
						],
						usage: {
							prompt_tokens: 0,
							completion_tokens: 0,
							total_tokens: 0,
						},
					};
				} else {
					// Regular text response
					const finalContent = processThink(content);
					response = {
						id: uuid,
						model: json.model || model,
						created,
						object: 'chat.completion',
						choices: [
							{
								index: 0,
								message: {
									role: 'assistant',
									content: finalContent,
								},
								finish_reason: 'stop',
							},
						],
						usage: {
							prompt_tokens: 0,
							completion_tokens: 0,
							total_tokens: 0,
						},
					};
				}

				// Cache the response if caching is enabled (don't cache function calls)
				if (env.CACHE_KV && cacheKey && shouldCache(aiParams) && !hasFunction) {
					// Cache for 1 hour by default, can be configured
					const cacheTtl =
						env.CACHE_TTL_SECONDS && parseInt(env.CACHE_TTL_SECONDS) > 0
							? parseInt(env.CACHE_TTL_SECONDS)
							: 3600;
					await cacheResponse(env.CACHE_KV, cacheKey, response, cacheTtl);
				}

				return Response.json(response);
			}
		} else {
			// if there is no header or it's not json, return an error
			return Response.json(
				{
					error: {
						message: 'Invalid request. Content-Type must be application/json',
						type: 'invalid_request_error',
						code: 'invalid_request',
					},
				},
				{ status: 400 },
			);
		}
	} catch (e) {
		console.error('Chat handler error:', e);
		return Response.json(
			{
				error: {
					message: e.message,
					type: 'invalid_request_error',
					code: 'invalid_request',
				},
			},
			{ status: 400 },
		);
	}
};
