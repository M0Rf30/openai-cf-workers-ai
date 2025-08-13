import { MODEL_CATEGORIES, MODEL_MAPPING, DEFAULT_MODELS } from '../utils/models.js';

export const completionHandler = async (request, env) => {
	let model = '@cf/mistral/mistral-7b-instruct-v0.1'; // Default model
	let error = null;

	// Get the current time in epoch seconds
	const created = Math.floor(Date.now() / 1000);
	const uuid = crypto.randomUUID();

	try {
		// If the POST data is JSON then attach it to our response
		if (request.headers.get('Content-Type') === 'application/json') {
			const json = await request.json();

			// Handle model selection - use real Cloudflare model names directly
			if (json?.model) {
				// Use supported Cloudflare models from unified configuration
				const supportedModels = MODEL_CATEGORIES.completion;

				// Check if the provided model is supported
				if (supportedModels.includes(json.model)) {
					model = json.model;
				} else {
					// Fallback to environment mapper for backward compatibility
					const mapper = env.MODEL_MAPPER ?? {};
					model = mapper[json.model] ? mapper[json.model] : json.model;

					// If still not in supported list, throw error
					if (!supportedModels.includes(model)) {
						throw new Error(
							`Unsupported model: ${json.model}. Supported models: ${supportedModels.join(', ')}`,
						);
					}
				}
			} else {
				// Use default model if none provided
				model = DEFAULT_MODELS.completion;
			}

			// Validate prompt
			if (json?.prompt) {
				if (typeof json.prompt === 'string') {
					if (json.prompt.length === 0) {
						return Response.json(
							{
								error: {
									message: 'no prompt provided',
									type: 'invalid_request_error',
									code: 'invalid_request',
								},
							},
							{ status: 400 },
						);
					}
				} else {
					return Response.json(
						{
							error: {
								message: 'prompt must be a string',
								type: 'invalid_request_error',
								code: 'invalid_request',
							},
						},
						{ status: 400 },
					);
				}
			} else {
				return Response.json(
					{
						error: {
							message: 'prompt is required',
							type: 'invalid_request_error',
							code: 'invalid_request',
						},
					},
					{ status: 400 },
				);
			}

			// Handle streaming
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

			// Log parameters for debugging
			console.log('AI Parameters:', {
				model,
				maxTokens,
				temperature,
				topP,
				promptLength: json.prompt.length,
				streaming: json.stream,
			});

			// Handle streaming response
			if (json.stream) {
				let buffer = '';
				const decoder = new TextDecoder();
				const encoder = new TextEncoder();
				const transformer = new TransformStream({
					transform(chunk, controller) {
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
									console.log(content);
									const doneflag = content.trim() == '[DONE]';
									if (doneflag) {
										controller.enqueue(encoder.encode('data: [DONE]\n\n'));
										return;
									}

									const data = JSON.parse(content);
									const newChunk =
										'data: ' +
										JSON.stringify({
											id: uuid,
											created,
											object: 'text_completion',
											model: json.model || model, // Return the requested model name
											choices: [
												{
													text: data.response,
													index: 0,
													logprobs: null,
													finish_reason: null,
												},
											],
										}) +
										'\n\n';
									controller.enqueue(encoder.encode(newChunk));
								}
							} catch (err) {
								console.error('Error parsing line:', err);
							}
						}
					},
				});

				// Prepare AI parameters
				const aiParams = {
					stream: json.stream,
					max_tokens: maxTokens,
					temperature,
					top_p: topP,
				};

				// Special handling for OpenAI OSS models that require 'input' instead of 'prompt'
				if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
					aiParams.input = json.prompt;
				} else {
					aiParams.prompt = json.prompt;
				}

				// Run the AI model with configured parameters
				const aiResp = await env.AI.run(model, aiParams);

				// Return streaming response
				return new Response(aiResp.pipeThrough(transformer), {
					headers: {
						'content-type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						'Connection': 'keep-alive',
					},
				});
			} else {
				// Non-streaming response
				// Prepare AI parameters
				const aiParams = {
					max_tokens: maxTokens,
					temperature,
					top_p: topP,
				};

				// Special handling for OpenAI OSS models that require 'input' instead of 'prompt'
				if (model === '@cf/openai/gpt-oss-120b' || model === '@cf/openai/gpt-oss-20b') {
					aiParams.input = json.prompt;
				} else {
					aiParams.prompt = json.prompt;
				}

				// Run the AI model with configured parameters
				const aiResp = await env.AI.run(model, aiParams);

				// Log response info for debugging
				if (aiResp.response) {
					console.log('AI Response length:', aiResp.response.length);
				}

				return Response.json({
					id: uuid,
					model: json.model || model, // Return the requested model name
					created,
					object: 'text_completion',
					choices: [
						{
							index: 0,
							finish_reason: 'stop',
							text: aiResp.response,
							logprobs: null,
						},
					],
					usage: {
						prompt_tokens: 0,
						completion_tokens: 0,
						total_tokens: 0,
					},
				});
			}
		}
	} catch (e) {
		error = e;
		console.error('Completion handler error:', e);
	}

	// If there is no header or it's not json, return an error
	if (error) {
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'invalid_request_error',
					code: 'invalid_request',
				},
			},
			{ status: 400 },
		);
	}

	// If we get here, return a 400 error
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
};
