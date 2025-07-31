// OpenAI-Compatible Chat Completions Handler for Cloudflare Workers AI
// Supports both streaming and non-streaming responses with comprehensive validation

import { validateChatCompletionRequest, validateModel } from '../utils/validation.js';
import { 
	createErrorResponse, 
	createSuccessResponse,
	logError,
} from '../utils/errors.js';
import { formatChatCompletion, getCORSHeaders, createStreamResponse } from '../utils/format.js';

export const chatHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		// Validate request content type
		if (!request.headers.get('Content-Type')?.includes('application/json')) {
			return createErrorResponse({
				message: 'Content-Type must be application/json',
				type: 'invalid_request_error',
			}, 400);
		}

		const body = await request.json();
		const validated = validateChatCompletionRequest(body);

		// Map OpenAI model name to Cloudflare model
		const modelPath = validateModel('chat', validated.model);
		
		console.log('Chat completion request:', {
			model: validated.model,
			modelPath,
			messageCount: validated.messages.length,
			streaming: validated.stream,
			maxTokens: validated.max_tokens,
			temperature: validated.temperature,
		});

		// Prepare AI parameters
		const aiParams = {
			messages: validated.messages,
		};

		// Add optional parameters
		if (validated.max_tokens) {
			aiParams.max_tokens = validated.max_tokens;
		}
		if (validated.temperature !== undefined) {
			aiParams.temperature = validated.temperature;
		}
		if (validated.top_p !== undefined) {
			aiParams.top_p = validated.top_p;
		}
		if (validated.presence_penalty !== undefined) {
			aiParams.presence_penalty = validated.presence_penalty;
		}
		if (validated.frequency_penalty !== undefined) {
			aiParams.frequency_penalty = validated.frequency_penalty;
		}
		if (validated.stop) {
			aiParams.stop = validated.stop;
		}

		// Handle streaming vs non-streaming
		if (validated.stream) {
			return handleChatStreaming(env, modelPath, aiParams, validated.model);
		} else {
			// Non-streaming response
			const response = await env.AI.run(modelPath, aiParams);
			const formatted = formatChatCompletion(response, validated.model, false);
			return createSuccessResponse(formatted);
		}

	} catch (error) {
		logError(error, {
			endpoint: '/chat/completions',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Enhanced streaming handler with proper SSE formatting
async function handleChatStreaming(env, modelPath, aiParams, originalModel) {
	const encoder = new TextEncoder();
	
	// Add stream parameter to AI params
	const streamParams = { ...aiParams, stream: true };
	
	try {
		const aiResponse = await env.AI.run(modelPath, streamParams);
		
		// Transform Cloudflare AI streaming response to OpenAI format
		const transformer = new TransformStream({
			start(controller) {
				// Send initial chunk with role
				const initialChunk = {
					id: `chatcmpl-${generateId()}`,
					object: 'chat.completion.chunk',
					created: Math.floor(Date.now() / 1000),
					model: originalModel,
					choices: [{
						index: 0,
						delta: {
							role: 'assistant',
						},
						finish_reason: null,
					}],
				};
				
				const data = `data: ${JSON.stringify(initialChunk)}\n\n`;
				controller.enqueue(encoder.encode(data));
			},
			
			transform(chunk, controller) {
				try {
					const decoder = new TextDecoder();
					const text = decoder.decode(chunk);
					
					// Parse Cloudflare AI streaming format
					const lines = text.split('\n');
					
					for (const line of lines) {
						if (line.startsWith('data: ')) {
							const content = line.slice('data: '.length).trim();
							
							if (content === '[DONE]') {
								// Send final chunk
								const finalChunk = {
									id: `chatcmpl-${generateId()}`,
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
								return;
							}
							
							try {
								const parsed = JSON.parse(content);
								
								// Transform to OpenAI format
								const openaiChunk = {
									id: `chatcmpl-${generateId()}`,
									object: 'chat.completion.chunk',
									created: Math.floor(Date.now() / 1000),
									model: originalModel,
									choices: [{
										index: 0,
										delta: {
											content: parsed.response || parsed.text || '',
										},
										finish_reason: null,
									}],
								};
								
								const data = `data: ${JSON.stringify(openaiChunk)}\n\n`;
								controller.enqueue(encoder.encode(data));
								
							} catch (parseError) {
								console.error('Error parsing streaming chunk:', parseError);
							}
						}
					}
				} catch (error) {
					console.error('Error in stream transform:', error);
				}
			},
			
			flush(controller) {
				// Ensure stream ends properly
				controller.enqueue(encoder.encode('data: [DONE]\n\n'));
			},
		});
		
		// Return streaming response
		return new Response(aiResponse.pipeThrough(transformer), {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				...getCORSHeaders(),
			},
		});
		
	} catch (error) {
		// Handle streaming errors
		const errorStream = new ReadableStream({
			start(controller) {
				const errorData = {
					error: {
						message: error.message,
						type: 'server_error',
					}
				};
				
				const data = `data: ${JSON.stringify(errorData)}\n\n`;
				controller.enqueue(encoder.encode(data));
				controller.enqueue(encoder.encode('data: [DONE]\n\n'));
				controller.close();
			},
		});
		
		return new Response(errorStream, {
			status: 500,
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive', 
				...getCORSHeaders(),
			},
		});
	}
}

// Utility function to generate unique IDs
function generateId(length = 29) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
