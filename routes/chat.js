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

async function handleChatStreaming(env, modelPath, aiParams, originalModel) {
	const stream = await env.AI.run(modelPath, { ...aiParams, stream: true });
	return createStreamResponse(stream, originalModel);
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
