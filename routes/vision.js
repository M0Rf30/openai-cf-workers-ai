// OpenAI-Compatible Vision Handler for Cloudflare Workers AI
// Supports image analysis, OCR, and visual question answering

import { validateModel, MODEL_MAPPING } from '../utils/validation.js';
import { 
	ValidationError, 
	createErrorResponse, 
	createSuccessResponse,
	validateRequired,
	validateString,
	validateArray,
	validateNumber,
	logError,
} from '../utils/errors.js';
import { formatChatCompletion, getCORSHeaders } from '../utils/format.js';

// OpenAI-compatible vision chat completions
// POST /chat/completions (with vision content)
export const visionChatHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const body = await request.json();
		const validated = validateVisionChatRequest(body);

		// Extract text and images from messages
		const { messages, processedMessages, hasImages } = processVisionMessages(validated.messages);

		if (!hasImages) {
			throw new ValidationError('Vision models require at least one image in the conversation');
		}

		// Use vision-capable model
		const modelPath = validateModel('vision', validated.model);

		// Prepare input for Cloudflare Workers AI vision model
		const input = {
			messages: processedMessages,
		};

		// Add optional parameters
		if (validated.max_tokens) {
			input.max_tokens = validated.max_tokens;
		}
		if (validated.temperature !== undefined) {
			input.temperature = validated.temperature;
		}
		if (validated.top_p !== undefined) {
			input.top_p = validated.top_p;
		}

		console.log(`Vision chat request - Model: ${modelPath}, Messages: ${processedMessages.length}`);

		// Handle streaming vs non-streaming
		if (validated.stream) {
			return handleVisionStreaming(env, modelPath, input, validated.model);
		} else {
			const response = await env.AI.run(modelPath, input);
			const formatted = formatChatCompletion(response, validated.model, false);
			return createSuccessResponse(formatted);
		}

	} catch (error) {
		logError(error, {
			endpoint: '/chat/completions (vision)',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Image analysis endpoint
// POST /images/analyze
export const imageAnalysisHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const body = await request.json();
		const validated = validateImageAnalysisRequest(body);

		const modelPath = validateModel('vision', validated.model);

		// Prepare analysis prompt based on task
		let analysisPrompt;
		switch (validated.task) {
			case 'describe':
				analysisPrompt = validated.prompt || 'Describe what you see in this image in detail.';
				break;
			case 'ocr':
				analysisPrompt = 'Extract and transcribe all text visible in this image. Provide the text exactly as it appears.';
				break;
			case 'objects':
				analysisPrompt = 'Identify and list all objects visible in this image.';
				break;
			case 'people':
				analysisPrompt = 'Describe the people in this image, including their appearance, clothing, and actions.';
				break;
			case 'scene':
				analysisPrompt = 'Describe the scene, setting, and environment shown in this image.';
				break;
			case 'custom':
				analysisPrompt = validated.prompt;
				break;
			default:
				analysisPrompt = validated.prompt || 'Analyze this image and provide relevant information.';
		}

		// Prepare messages for vision model
		const messages = [
			{
				role: 'user',
				content: [
					{
						type: 'text',
						text: analysisPrompt,
					},
					{
						type: 'image_url',
						image_url: {
							url: validated.image_url,
							detail: validated.detail || 'auto',
						},
					},
				],
			},
		];

		const input = {
			messages,
		};

		if (validated.max_tokens) {
			input.max_tokens = validated.max_tokens;
		}

		console.log(`Image analysis - Model: ${modelPath}, Task: ${validated.task}`);

		const response = await env.AI.run(modelPath, input);

		const result = {
			task: validated.task,
			analysis: response.response || response.text || '',
			model: validated.model,
			image_url: validated.image_url,
		};

		// Add structured data for specific tasks
		if (validated.task === 'objects') {
			result.objects = extractObjects(result.analysis);
		} else if (validated.task === 'ocr') {
			result.extracted_text = result.analysis;
		}

		return createSuccessResponse(result);

	} catch (error) {
		logError(error, {
			endpoint: '/images/analyze',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Image classification endpoint  
// POST /images/classify
export const imageClassificationHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const body = await request.json();
		const validated = validateImageClassificationRequest(body);

		const modelPath = validateModel('image_classification', validated.model);

		// Convert image URL to required format
		let imageInput;
		if (validated.image_url) {
			// Fetch image data for classification model
			const imageResponse = await fetch(validated.image_url);
			if (!imageResponse.ok) {
				throw new ValidationError('Unable to fetch image from provided URL', 'image_url');
			}
			const imageBuffer = await imageResponse.arrayBuffer();
			imageInput = new Uint8Array(imageBuffer);
		} else {
			throw new ValidationError('Image URL is required for classification', 'image_url');
		}

		const input = {
			image: imageInput,
		};

		console.log(`Image classification - Model: ${modelPath}`);

		const response = await env.AI.run(modelPath, input);

		// Format classification results
		const predictions = response.predictions || response.scores || [];
		const formatted = predictions.map((pred, index) => ({
			label: pred.label || pred.class || `class_${index}`,
			confidence: pred.score || pred.confidence || 0,
		}));

		// Sort by confidence descending
		formatted.sort((a, b) => b.confidence - a.confidence);

		const result = {
			object: 'image_classification',
			model: validated.model,
			predictions: formatted.slice(0, validated.top_k || 5),
			image_url: validated.image_url,
		};

		return createSuccessResponse(result);

	} catch (error) {
		logError(error, {
			endpoint: '/images/classify',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Validation functions
function validateVisionChatRequest(body) {
	const { model, messages, max_tokens, temperature, top_p, stream } = body;

	validateRequired(model, 'model');
	validateRequired(messages, 'messages');
	validateArray(messages, 'messages', 1);

	// Validate each message
	messages.forEach((message, index) => {
		if (!message.role || !message.content) {
			throw new ValidationError(
				`Message at index ${index} must have 'role' and 'content' properties`,
				'messages'
			);
		}
		
		if (message.role !== 'user' && message.role !== 'system' && message.role !== 'assistant') {
			throw new ValidationError(
				`Message role must be 'user', 'system', or 'assistant'`,
				`messages[${index}].role`
			);
		}

		// Content can be string or array for vision
		if (typeof message.content !== 'string' && !Array.isArray(message.content)) {
			throw new ValidationError(
				`Message content must be string or array`,
				`messages[${index}].content`
			);
		}

		// Validate vision content array
		if (Array.isArray(message.content)) {
			message.content.forEach((item, contentIndex) => {
				if (!item.type) {
					throw new ValidationError(
						`Content item must have a 'type' field`,
						`messages[${index}].content[${contentIndex}].type`
					);
				}
				
				if (item.type === 'text') {
					validateString(item.text, `messages[${index}].content[${contentIndex}].text`);
				} else if (item.type === 'image_url') {
					if (!item.image_url || !item.image_url.url) {
						throw new ValidationError(
							`Image content must have image_url.url`,
							`messages[${index}].content[${contentIndex}].image_url.url`
						);
					}
					validateString(item.image_url.url, `messages[${index}].content[${contentIndex}].image_url.url`);
				}
			});
		}
	});

	const validated = { model, messages };

	if (max_tokens !== undefined) {
		validated.max_tokens = validateNumber(max_tokens, 'max_tokens', 1, 4096);
	}
	if (temperature !== undefined) {
		validated.temperature = validateNumber(temperature, 'temperature', 0, 2);
	}
	if (top_p !== undefined) {
		validated.top_p = validateNumber(top_p, 'top_p', 0, 1);
	}
	if (stream !== undefined) {
		validated.stream = Boolean(stream);
	}

	return validated;
}

function validateImageAnalysisRequest(body) {
	const { 
		image_url, 
		model = 'gpt-4-vision-preview',
		task = 'describe',
		prompt,
		max_tokens,
		detail,
	} = body;

	validateRequired(image_url, 'image_url');
	validateString(image_url, 'image_url');

	const validTasks = ['describe', 'ocr', 'objects', 'people', 'scene', 'custom'];
	if (!validTasks.includes(task)) {
		throw new ValidationError(
			`Task must be one of: ${validTasks.join(', ')}`,
			'task'
		);
	}

	if (task === 'custom' && !prompt) {
		throw new ValidationError('Custom task requires a prompt', 'prompt');
	}

	const validated = { image_url, model, task };

	if (prompt) {
		validated.prompt = validateString(prompt, 'prompt');
	}
	if (max_tokens !== undefined) {
		validated.max_tokens = validateNumber(max_tokens, 'max_tokens', 1, 4096);
	}
	if (detail) {
		const validDetails = ['low', 'high', 'auto'];
		if (!validDetails.includes(detail)) {
			throw new ValidationError(
				`Detail must be one of: ${validDetails.join(', ')}`,
				'detail'
			);
		}
		validated.detail = detail;
	}

	return validated;
}

function validateImageClassificationRequest(body) {
	const { 
		image_url, 
		model = '@cf/microsoft/resnet-50',
		top_k,
	} = body;

	validateRequired(image_url, 'image_url');
	validateString(image_url, 'image_url');

	const validated = { image_url, model };

	if (top_k !== undefined) {
		validated.top_k = validateNumber(top_k, 'top_k', 1, 20);
	}

	return validated;
}

// Helper functions
function processVisionMessages(messages) {
	const processedMessages = [];
	let hasImages = false;

	for (const message of messages) {
		if (typeof message.content === 'string') {
			// Simple text message
			processedMessages.push({
				role: message.role,
				content: message.content,
			});
		} else if (Array.isArray(message.content)) {
			// Multi-modal content
			const processedContent = [];
			
			for (const item of message.content) {
				if (item.type === 'text') {
					processedContent.push({
						type: 'text',
						text: item.text,
					});
				} else if (item.type === 'image_url') {
					hasImages = true;
					processedContent.push({
						type: 'image_url',
						image_url: {
							url: item.image_url.url,
							detail: item.image_url.detail || 'auto',
						},
					});
				}
			}

			processedMessages.push({
				role: message.role,
				content: processedContent,
			});
		}
	}

	return { messages, processedMessages, hasImages };
}

async function handleVisionStreaming(env, modelPath, input, originalModel) {
	// Implement Server-Sent Events streaming for vision
	const encoder = new TextEncoder();
	
	const stream = new ReadableStream({
		async start(controller) {
			try {
				// For now, simulate streaming by chunking the response
				const response = await env.AI.run(modelPath, input);
				const text = response.response || response.text || '';
				
				// Split response into chunks
				const words = text.split(' ');
				const chunkSize = Math.max(1, Math.floor(words.length / 10));
				
				for (let i = 0; i < words.length; i += chunkSize) {
					const chunk = words.slice(i, i + chunkSize).join(' ');
					
					const streamChunk = {
						id: `chatcmpl-vision-${Date.now()}`,
						object: 'chat.completion.chunk',
						created: Math.floor(Date.now() / 1000),
						model: originalModel,
						choices: [{
							index: 0,
							delta: {
								role: i === 0 ? 'assistant' : undefined,
								content: chunk + (i + chunkSize < words.length ? ' ' : ''),
							},
							finish_reason: null,
						}],
					};

					const data = `data: ${JSON.stringify(streamChunk)}\n\n`;
					controller.enqueue(encoder.encode(data));

					// Small delay between chunks
					await new Promise(resolve => setTimeout(resolve, 100));
				}

				// Send final chunk
				const finalChunk = {
					id: `chatcmpl-vision-${Date.now()}`,
					object: 'chat.completion.chunk',
					created: Math.floor(Date.now() / 1000),
					model: originalModel,
					choices: [{
						index: 0,
						delta: {},
						finish_reason: 'stop',
					}],
				};

				const finalData = `data: ${JSON.stringify(finalChunk)}\n\n`;
				controller.enqueue(encoder.encode(finalData));
				controller.enqueue(encoder.encode('data: [DONE]\n\n'));
				controller.close();

			} catch (error) {
				const errorData = `data: ${JSON.stringify({ error: error.message })}\n\n`;
				controller.enqueue(encoder.encode(errorData));
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			...getCORSHeaders(),
		},
	});
}

function extractObjects(analysisText) {
	// Simple object extraction from analysis text
	// This is a basic implementation - could be enhanced with NLP
	const objects = [];
	const commonObjects = [
		'person', 'people', 'man', 'woman', 'child', 'baby',
		'car', 'truck', 'bus', 'bicycle', 'motorcycle',
		'dog', 'cat', 'bird', 'horse', 'cow', 'sheep',
		'tree', 'flower', 'grass', 'building', 'house',
		'table', 'chair', 'book', 'phone', 'computer',
		'food', 'drink', 'bottle', 'cup', 'plate',
	];

	const lowerText = analysisText.toLowerCase();
	
	for (const object of commonObjects) {
		if (lowerText.includes(object)) {
			objects.push({
				name: object,
				confidence: 0.8, // Placeholder confidence
			});
		}
	}

	return objects;
}