import { uint8ArrayToBase64 } from '../utils/converters';
import { uuidv4 } from '../utils/uuid';

export const imageGenerationHandler = async (request, env) => {
	let model = '@cf/black-forest-labs/flux-1-schnell'; // Default model
	let format = 'url';
	let error = null;
	let created = Math.floor(Date.now() / 1000);

	try {
		if (request.headers.get('Content-Type') === 'application/json') {
			let json = await request.json();

			if (!json?.prompt) {
				throw new Error('no prompt provided');
			}

			if (json?.format) {
				format = json.format;
				if (format !== 'b64_json' && format !== 'url') {
					throw new Error('invalid format. must be b64_json or url');
				}
			}

			// Handle model selection - use real Cloudflare model names directly
			if (json?.model) {
				// List of supported Cloudflare models
				const supportedModels = [
					'@cf/black-forest-labs/flux-1-schnell',
					'@cf/bytedance/stable-diffusion-xl-lightning',
					'@cf/runwayml/stable-diffusion-v1-5-img2img',
					'@cf/runwayml/stable-diffusion-v1-5-inpainting',
					'@cf/stabilityai/stable-diffusion-xl-base-1.0',
					'@cf/lykon/dreamshaper-8-lcm',
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

			const inputs = {
				prompt: json.prompt,
				seed: json.seed || Math.floor(Math.random() * 10000),
			};

			// Run the AI model
			const response = await env.AI.run(model, inputs);

			// Handle the response based on the model type
			let imageBuffer;

			if (response.image) {
				// For models that return base64 string (like Flux)
				const binaryString = atob(response.image);
				imageBuffer = Uint8Array.from(binaryString, m => m.codePointAt(0));
			} else if (response instanceof ReadableStream) {
				// For models that return streams
				imageBuffer = await streamToBuffer(response);
			} else {
				// Fallback: assume response is already a buffer
				imageBuffer = new Uint8Array(response);
			}

			if (format === 'b64_json') {
				const b64_json = uint8ArrayToBase64(imageBuffer);
				return new Response(
					JSON.stringify({
						data: [
							{
								b64_json,
								revised_prompt: json.prompt, // OpenAI compatibility
							},
						],
						created,
					}),
					{
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);
			} else {
				// Check if R2 bucket is available
				if (!env.IMAGE_BUCKET) {
					// Fallback to base64 if no R2 bucket configured
					const b64_json = uint8ArrayToBase64(imageBuffer);
					return new Response(
						JSON.stringify({
							data: [
								{
									b64_json,
									revised_prompt: json.prompt,
									warning: 'R2 bucket not configured, returning base64 instead of URL',
								},
							],
							created,
						}),
						{
							headers: {
								'Content-Type': 'application/json',
							},
						}
					);
				}

				const name = uuidv4() + '.png';
				await env.IMAGE_BUCKET.put(name, imageBuffer);

				// Construct the URL
				const urlObj = new URL(request.url);
				const url = urlObj.origin + '/v1/images/get/' + name;

				return new Response(
					JSON.stringify({
						data: [
							{
								url,
								revised_prompt: json.prompt, // OpenAI compatibility
							},
						],
						created,
					}),
					{
						headers: {
							'Content-Type': 'application/json',
						},
					}
				);
			}
		}
	} catch (e) {
		error = e;
		console.error('Image generation error:', e);
	}

	// Error handling
	if (error) {
		return new Response(
			JSON.stringify({
				error: {
					message: error.message,
					type: 'invalid_request_error',
					code: 'invalid_request',
				},
			}),
			{
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	// Default error for invalid requests
	return new Response(
		JSON.stringify({
			error: {
				message: 'Invalid request. Content-Type must be application/json',
				type: 'invalid_request_error',
				code: 'invalid_request',
			},
		}),
		{
			status: 400,
			headers: {
				'Content-Type': 'application/json',
			},
		}
	);
};

export const getImageHandler = async (request, env) => {
	const { params } = request;
	const { name } = params;

	if (!name) {
		return new Response(
			JSON.stringify({
				error: {
					message: 'Image name not provided',
					type: 'not_found_error',
					code: 'not_found',
				},
			}),
			{
				status: 404,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}

	try {
		const image = await env.IMAGE_BUCKET.get(name);
		if (!image) {
			return new Response(
				JSON.stringify({
					error: {
						message: 'Image not found',
						type: 'not_found_error',
						code: 'not_found',
					},
				}),
				{
					status: 404,
					headers: {
						'Content-Type': 'application/json',
					},
				}
			);
		}

		return new Response(image.body, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
			},
		});
	} catch (error) {
		console.error('Error retrieving image:', error);
		return new Response(
			JSON.stringify({
				error: {
					message: 'Internal server error',
					type: 'server_error',
					code: 'server_error',
				},
			}),
			{
				status: 500,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
};

// Helper function for streaming models (if needed)
async function streamToBuffer(stream) {
	const reader = stream.getReader();
	const chunks = [];

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}

	// Calculate total length
	const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);

	// Combine all chunks
	const buffer = new Uint8Array(totalLength);
	let offset = 0;
	for (const chunk of chunks) {
		buffer.set(chunk, offset);
		offset += chunk.length;
	}

	return buffer;
}
