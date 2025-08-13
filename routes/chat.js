import { generateCacheKey, cacheResponse, getCachedResponse, shouldCache } from '../utils/cache.js';
import { convertImageToDataURL } from '../utils/converters.js';
import {
	processFunctionMessages,
	addFunctionContext,
	parseFunctionCall,
	formatFunctionCallResponse,
} from '../utils/functionCalling.js';
import { MODEL_CATEGORIES, DEFAULT_MODELS } from '../utils/models.js';

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
		})
	);
}

export const chatHandler = async (request, env) => {
	let model = '@cf/meta/llama-4-scout-17b-16e-instruct'; // Default model
	let messages = [];
	const error = null;

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
						`Unsupported model: ${json.model}. Supported models: ${supportedModels.join(', ')}`
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
					{ status: 400 }
				);
			}

			if (!json?.stream) json.stream = false;

			// Handle max_tokens parameter with reasonable defaults and limits
			let maxTokens = 4096; // Default reasonable limit
			if (json?.max_tokens) {
				if (typeof json.max_tokens === 'number' && json.max_tokens > 0) {
					// Set reasonable bounds: minimum 1, maximum 4096 (adjust based on your needs)
					maxTokens = Math.max(1, Math.min(json.max_tokens, 4096));
				}
			}

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
				maxTokens,
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

			const transformer = new TransformStream({
				transform(chunk, controller) {
					if (isFinished) return;

					buffer += decoder.decode(chunk);
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
														content: JSON.stringify(data),
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
				max_tokens: maxTokens,
				temperature,
				top_p: topP,
			};

			// Special handling for OpenAI OSS models that require 'input' instead of 'messages'
			// Process messages for multimodal content
			processedMessages = await processMultimodalMessages(messages);

			if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
				// For OSS models, we need to convert messages to a single input string
				// This is a simple conversion - in a production environment, you might want more sophisticated formatting
				let inputText = '';
				for (const message of processedMessages) {
					// Use processedMessages here
					if (message.role === 'system') {
						inputText += `[SYSTEM] ${message.content}\n`;
					} else if (message.role === 'user') {
						inputText += `[USER] ${message.content}\n`;
					} else if (message.role === 'assistant') {
						inputText += `[ASSISTANT] ${message.content}\n`;
					}
				}
				aiParams.input = inputText.trim();
			} else {
				// Handle function calling
				if (tools) {
					// Convert function calling messages to a format Cloudflare Workers AI understands
					processedMessages = processFunctionMessages(processedMessages, tools); // Use processedMessages here
					processedMessages = addFunctionContext(processedMessages, tools); // Use processedMessages here
				}
				aiParams.messages = processedMessages;
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

			// Run the AI model with configured parameters
			const aiResp = await env.AI.run(model, aiParams);

			// Log response info for debugging
			console.log('AI Raw Response:', aiResp);
			if (!json.stream && aiResp.result && aiResp.result.response) {
				console.log('AI Response length:', aiResp.result.response.length);
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
				const { hasFunction, functionCall, content } = parseFunctionCall(aiResp);

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
									content: aiResp.output && aiResp.output["1"] && aiResp.output["1"].content && aiResp.output["1"].content["0"] && aiResp.output["1"].content["0"].text,
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
			{ status: 400 }
		);
	}

	// if there is no header or it's not json, return an error
	if (error) {
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'invalid_request_error',
					code: 'invalid_request',
				},
			},
			{ status: 400 }
		);
	}

	// if we get here, return a 400 error
	return Response.json(
		{
			error: {
				message: 'Invalid request. Content-Type must be application/json',
				type: 'invalid_request_error',
				code: 'invalid_request',
			},
		},
		{ status: 400 }
	);
};
