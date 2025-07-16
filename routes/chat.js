export const chatHandler = async (request, env) => {
	let model = '@cf/meta/llama-4-scout-17b-16e-instruct'; // Default model
	let messages = [];
	let error = null;

	// get the current time in epoch seconds
	const created = Math.floor(Date.now() / 1000);
	const uuid = crypto.randomUUID();

	try {
		// If the POST data is JSON then attach it to our response.
		if (request.headers.get('Content-Type') === 'application/json') {
			let json = await request.json();

			// Handle model selection - use real Cloudflare model names directly
			if (json?.model) {
				// List of supported Cloudflare models
				const supportedModels = [
					'@cf/qwen/qwen1.5-0.5b-chat',
					'@cf/huggingface/distilbert-sst-2-int8',
					'@cf/google/gemma-2b-it-lora',
					'@hf/nexusflow/starling-lm-7b-beta',
					'@cf/meta/llama-3-8b-instruct',
					'@cf/meta/llama-3.2-3b-instruct',
					'@hf/thebloke/llamaguard-7b-awq',
					'@hf/thebloke/neural-chat-7b-v3-1-awq',
					'@cf/meta/llama-guard-3-8b',
					'@cf/meta/llama-2-7b-chat-fp16',
					'@cf/mistral/mistral-7b-instruct-v0.1',
					'@cf/mistral/mistral-7b-instruct-v0.2-lora',
					'@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
					'@hf/mistral/mistral-7b-instruct-v0.2',
					'@cf/fblgit/una-cybertron-7b-v2-bf16',
					'@cf/llava-hf/llava-1.5-7b-hf',
					'@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
					'@cf/thebloke/discolm-german-7b-v1-awq',
					'@cf/meta/llama-2-7b-chat-int8',
					'@cf/meta/llama-3.1-8b-instruct-fp8',
					'@hf/thebloke/mistral-7b-instruct-v0.1-awq',
					'@cf/qwen/qwen1.5-7b-chat-awq',
					'@cf/meta/llama-3.2-1b-instruct',
					'@hf/thebloke/llama-2-13b-chat-awq',
					'@cf/microsoft/resnet-50',
					'@hf/thebloke/deepseek-coder-6.7b-base-awq',
					'@cf/meta-llama/llama-2-7b-chat-hf-lora',
					'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
					'@hf/thebloke/openhermes-2.5-mistral-7b-awq',
					'@cf/meta/m2m100-1.2b',
					'@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
					'@cf/baai/bge-small-en-v1.5',
					'@cf/qwen/qwen2.5-coder-32b-instruct',
					'@cf/deepseek-ai/deepseek-math-7b-instruct',
					'@cf/tiiuae/falcon-7b-instruct',
					'@hf/nousresearch/hermes-2-pro-mistral-7b',
					'@cf/meta/llama-3.1-8b-instruct-awq',
					'@cf/unum/uform-gen2-qwen-500m',
					'@hf/thebloke/zephyr-7b-beta-awq',
					'@cf/google/gemma-7b-it-lora',
					'@cf/qwen/qwen1.5-1.8b-chat',
					'@cf/mistralai/mistral-small-3.1-24b-instruct',
					'@cf/meta/llama-3-8b-instruct-awq',
					'@cf/meta/llama-3.2-11b-vision-instruct',
					'@cf/defog/sqlcoder-7b-2',
					'@cf/microsoft/phi-2',
					'@hf/meta-llama/meta-llama-3-8b-instruct',
					'@cf/facebook/bart-large-cnn',
					'@cf/baai/bge-reranker-base',
					'@hf/google/gemma-7b-it',
					'@cf/qwen/qwen1.5-14b-chat-awq',
					'@cf/openchat/openchat-3.5-0106',
					'@cf/meta/llama-4-scout-17b-16e-instruct',
					'@cf/google/gemma-3-12b-it',
					'@cf/qwen/qwq-32b',
				];

				// Check if the provided model is supported
				if (supportedModels.includes(json.model)) {
					model = json.model;
				} else {
					throw new Error(
						`Unsupported model: ${json.model}. Supported models: ${supportedModels.join(', ')}`
					);
				}
			}

			if (json?.messages) {
				if (Array.isArray(json.messages)) {
					if (json.messages.length === 0) {
						return Response.json(
							{
								error: {
									message: 'no messages provided',
									type: 'invalid_request_error',
									code: 'invalid_request',
								},
							},
							{ status: 400 }
						);
					}
					messages = json.messages;
				}
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

			// Log parameters for debugging
			console.log('AI Parameters:', {
				model,
				maxTokens,
				temperature,
				topP,
				messageCount: messages.length,
				streaming: json.stream,
			});

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
										object: 'chat.completion.chunk',
										model: json.model || model, // Return the requested model name
										choices: [
											{
												delta: { content: data.response },
												index: 0,
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
				messages,
				max_tokens: maxTokens,
				temperature,
				top_p: topP,
			};

			// Run the AI model with configured parameters
			const aiResp = await env.AI.run(model, aiParams);

			// Log response info for debugging
			if (!json.stream && aiResp.response) {
				console.log('AI Response length:', aiResp.response.length);
			}

			// Piping the readableStream through the transformStream
			return json.stream
				? new Response(aiResp.pipeThrough(transformer), {
						headers: {
							'content-type': 'text/event-stream',
							'Cache-Control': 'no-cache',
							'Connection': 'keep-alive',
						},
					})
				: Response.json({
						id: uuid,
						model: json.model || model, // Return the requested model name
						created,
						object: 'chat.completion',
						choices: [
							{
								index: 0,
								message: {
									role: 'assistant',
									content: aiResp.response,
								},
								finish_reason: 'stop',
							},
						],
						usage: {
							prompt_tokens: 0,
							completion_tokens: 0,
							total_tokens: 0,
						},
					});
		}
	} catch (e) {
		error = e;
		console.error('Chat handler error:', e);
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
