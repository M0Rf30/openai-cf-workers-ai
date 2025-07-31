// OpenAI-Compatible Assistants API Handler for Cloudflare Workers AI
// Note: Simplified implementation using Cloudflare Workers AI for backend processing

import { validateModel } from '../utils/validation.js';
import { 
	ValidationError,
	createErrorResponse, 
	createSuccessResponse,
	validateRequired,
	validateString,
	validateArray,
	validateNumber,
	validateEnum,
	logError,
} from '../utils/errors.js';
import { getCORSHeaders } from '../utils/format.js';

// In-memory storage for demo (use Cloudflare KV/Durable Objects in production)
const assistants = new Map();
const threads = new Map();
const messages = new Map();

// Create assistant
// POST /assistants
export const createAssistantHandler = async (request, env) => {
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
			throw new ValidationError('Content-Type must be application/json');
		}

		const body = await request.json();
		const validated = validateCreateAssistantRequest(body);

		const assistantId = `asst_${generateId()}`;
		const assistant = {
			id: assistantId,
			object: 'assistant',
			created_at: Math.floor(Date.now() / 1000),
			name: validated.name,
			description: validated.description,
			model: validated.model,
			instructions: validated.instructions,
			tools: validated.tools || [],
			metadata: validated.metadata || {},
		};

		// Store assistant (use KV storage in production)
		assistants.set(assistantId, assistant);

		console.log(`Created assistant: ${assistantId}`);

		return createSuccessResponse(assistant);

	} catch (error) {
		logError(error, {
			endpoint: '/assistants',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// List assistants
// GET /assistants
export const listAssistantsHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const limit = parseInt(url.searchParams.get('limit') || '20');
		const order = url.searchParams.get('order') || 'desc';
		const after = url.searchParams.get('after');
		const before = url.searchParams.get('before');

		// Get all assistants (implement pagination in production)
		const allAssistants = Array.from(assistants.values());
		
		// Sort by created_at
		allAssistants.sort((a, b) => {
			return order === 'desc' ? b.created_at - a.created_at : a.created_at - b.created_at;
		});

		// Apply pagination (simplified)
		const data = allAssistants.slice(0, limit);

		return createSuccessResponse({
			object: 'list',
			data,
			first_id: data.length > 0 ? data[0].id : null,
			last_id: data.length > 0 ? data[data.length - 1].id : null,
			has_more: allAssistants.length > limit,
		});

	} catch (error) {
		logError(error, {
			endpoint: '/assistants',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Get assistant
// GET /assistants/{assistant_id}
export const getAssistantHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const assistantId = url.pathname.split('/').pop();

		if (!assistantId) {
			throw new ValidationError('Assistant ID is required');
		}

		const assistant = assistants.get(assistantId);
		if (!assistant) {
			throw new ValidationError('Assistant not found', null, 404);
		}

		return createSuccessResponse(assistant);

	} catch (error) {
		logError(error, {
			endpoint: '/assistants/{id}',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Create thread
// POST /threads
export const createThreadHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const body = request.headers.get('Content-Type')?.includes('application/json') 
			? await request.json() 
			: {};

		const validated = validateCreateThreadRequest(body);

		const threadId = `thread_${generateId()}`;
		const thread = {
			id: threadId,
			object: 'thread',
			created_at: Math.floor(Date.now() / 1000),
			metadata: validated.metadata || {},
		};

		// Store thread
		threads.set(threadId, thread);

		// If initial messages provided, add them
		if (validated.messages && validated.messages.length > 0) {
			const threadMessages = [];
			for (const msg of validated.messages) {
				const messageId = `msg_${generateId()}`;
				const message = {
					id: messageId,
					object: 'thread.message',
					created_at: Math.floor(Date.now() / 1000),
					thread_id: threadId,
					role: msg.role,
					content: msg.content,
					metadata: msg.metadata || {},
				};
				threadMessages.push(message);
			}
			messages.set(threadId, threadMessages);
		}

		console.log(`Created thread: ${threadId}`);

		return createSuccessResponse(thread);

	} catch (error) {
		logError(error, {
			endpoint: '/threads',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Create message
// POST /threads/{thread_id}/messages
export const createMessageHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		const threadId = pathParts[pathParts.length - 2]; // thread ID is second to last

		if (!threadId) {
			throw new ValidationError('Thread ID is required');
		}

		if (!threads.has(threadId)) {
			throw new ValidationError('Thread not found', null, 404);
		}

		const body = await request.json();
		const validated = validateCreateMessageRequest(body);

		const messageId = `msg_${generateId()}`;
		const message = {
			id: messageId,
			object: 'thread.message',
			created_at: Math.floor(Date.now() / 1000),
			thread_id: threadId,
			role: validated.role,
			content: validated.content,
			metadata: validated.metadata || {},
		};

		// Add message to thread
		const threadMessages = messages.get(threadId) || [];
		threadMessages.push(message);
		messages.set(threadId, threadMessages);

		console.log(`Created message: ${messageId} in thread: ${threadId}`);

		return createSuccessResponse(message);

	} catch (error) {
		logError(error, {
			endpoint: '/threads/{id}/messages',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Create run
// POST /threads/{thread_id}/runs
export const createRunHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		const threadId = pathParts[pathParts.length - 2]; // thread ID is second to last

		if (!threadId) {
			throw new ValidationError('Thread ID is required');
		}

		if (!threads.has(threadId)) {
			throw new ValidationError('Thread not found', null, 404);
		}

		const body = await request.json();
		const validated = validateCreateRunRequest(body);

		const assistant = assistants.get(validated.assistant_id);
		if (!assistant) {
			throw new ValidationError('Assistant not found', null, 404);
		}

		const runId = `run_${generateId()}`;
		
		// Get thread messages
		const threadMessages = messages.get(threadId) || [];
		
		// Process the run using Cloudflare Workers AI
		console.log(`Processing run: ${runId} for assistant: ${validated.assistant_id}`);
		
		try {
			// Map assistant model to Cloudflare model
			const modelPath = validateModel('chat', assistant.model);
			
			// Prepare messages for AI
			const aiMessages = [];
			
			// Add system message from assistant instructions
			if (assistant.instructions) {
				aiMessages.push({
					role: 'system',
					content: assistant.instructions,
				});
			}
			
			// Add thread messages
			threadMessages.forEach(msg => {
				if (Array.isArray(msg.content)) {
					// Handle array content (simplified)
					const textContent = msg.content
						.filter(c => c.type === 'text')
						.map(c => c.text.value)
						.join('\n');
					
					if (textContent) {
						aiMessages.push({
							role: msg.role,
							content: textContent,
						});
					}
				} else if (typeof msg.content === 'string') {
					aiMessages.push({
						role: msg.role,
						content: msg.content,
					});
				}
			});

			// Run AI model
			const response = await env.AI.run(modelPath, {
				messages: aiMessages,
				max_tokens: validated.max_tokens || 1000,
				temperature: validated.temperature || 0.7,
			});

			// Create assistant message
			const assistantMessageId = `msg_${generateId()}`;
			const assistantMessage = {
				id: assistantMessageId,
				object: 'thread.message',
				created_at: Math.floor(Date.now() / 1000),
				thread_id: threadId,
				role: 'assistant',
				content: [{
					type: 'text',
					text: {
						value: response.response || response.text || '',
						annotations: [],
					},
				}],
				metadata: {},
			};

			// Add assistant message to thread
			threadMessages.push(assistantMessage);
			messages.set(threadId, threadMessages);

			// Create run object
			const run = {
				id: runId,
				object: 'thread.run',
				created_at: Math.floor(Date.now() / 1000),
				thread_id: threadId,
				assistant_id: validated.assistant_id,
				status: 'completed',
				required_action: null,
				last_error: null,
				expires_at: Math.floor(Date.now() / 1000) + 600, // 10 minutes
				started_at: Math.floor(Date.now() / 1000),
				completed_at: Math.floor(Date.now() / 1000),
				model: assistant.model,
				instructions: assistant.instructions,
				tools: assistant.tools,
				metadata: validated.metadata || {},
			};

			return createSuccessResponse(run);

		} catch (aiError) {
			console.error(`AI processing error for run ${runId}:`, aiError);
			
			// Create failed run
			const run = {
				id: runId,
				object: 'thread.run',
				created_at: Math.floor(Date.now() / 1000),
				thread_id: threadId,
				assistant_id: validated.assistant_id,
				status: 'failed',
				required_action: null,
				last_error: {
					code: 'server_error',
					message: aiError.message,
				},
				expires_at: Math.floor(Date.now() / 1000) + 600,
				started_at: Math.floor(Date.now() / 1000),
				completed_at: Math.floor(Date.now() / 1000),
				model: assistant.model,
				instructions: assistant.instructions,
				tools: assistant.tools,
				metadata: validated.metadata || {},
			};

			return createSuccessResponse(run);
		}

	} catch (error) {
		logError(error, {
			endpoint: '/threads/{id}/runs',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// List messages
// GET /threads/{thread_id}/messages
export const listMessagesHandler = async (request, env) => {
	try {
		// Handle CORS preflight
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: getCORSHeaders(),
			});
		}

		const url = new URL(request.url);
		const pathParts = url.pathname.split('/');
		const threadId = pathParts[pathParts.length - 2]; // thread ID is second to last

		if (!threadId) {
			throw new ValidationError('Thread ID is required');
		}

		if (!threads.has(threadId)) {
			throw new ValidationError('Thread not found', null, 404);
		}

		const limit = parseInt(url.searchParams.get('limit') || '20');
		const order = url.searchParams.get('order') || 'desc';

		// Get thread messages
		const threadMessages = messages.get(threadId) || [];
		
		// Sort by created_at
		threadMessages.sort((a, b) => {
			return order === 'desc' ? b.created_at - a.created_at : a.created_at - b.created_at;
		});

		// Apply pagination
		const data = threadMessages.slice(0, limit);

		return createSuccessResponse({
			object: 'list',
			data,
			first_id: data.length > 0 ? data[0].id : null,
			last_id: data.length > 0 ? data[data.length - 1].id : null,
			has_more: threadMessages.length > limit,
		});

	} catch (error) {
		logError(error, {
			endpoint: '/threads/{id}/messages',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Validation functions
function validateCreateAssistantRequest(body) {
	const { model, name, description, instructions, tools, metadata } = body;

	validateRequired(model, 'model');

	const validated = { model };

	if (name) {
		validated.name = validateString(name, 'name', 1, 256);
	}
	if (description) {
		validated.description = validateString(description, 'description', 1, 512);
	}
	if (instructions) {
		validated.instructions = validateString(instructions, 'instructions', 1, 32768);
	}
	if (tools) {
		validateArray(tools, 'tools', 0, 128);
		validated.tools = tools;
	}
	if (metadata && typeof metadata === 'object') {
		validated.metadata = metadata;
	}

	return validated;
}

function validateCreateThreadRequest(body) {
	const { messages, metadata } = body;

	const validated = {};

	if (messages) {
		validateArray(messages, 'messages');
		validated.messages = messages;
	}
	if (metadata && typeof metadata === 'object') {
		validated.metadata = metadata;
	}

	return validated;
}

function validateCreateMessageRequest(body) {
	const { role, content, metadata } = body;

	validateRequired(role, 'role');
	validateRequired(content, 'content');

	const allowedRoles = ['user', 'assistant'];
	if (!allowedRoles.includes(role)) {
		throw new ValidationError(
			`Role must be one of: ${allowedRoles.join(', ')}`,
			'role'
		);
	}

	const validated = { role, content };

	if (metadata && typeof metadata === 'object') {
		validated.metadata = metadata;
	}

	return validated;
}

function validateCreateRunRequest(body) {
	const { assistant_id, model, instructions, additional_instructions, max_tokens, temperature, metadata } = body;

	validateRequired(assistant_id, 'assistant_id');
	validateString(assistant_id, 'assistant_id');

	const validated = { assistant_id };

	if (model) {
		validated.model = validateString(model, 'model');
	}
	if (instructions) {
		validated.instructions = validateString(instructions, 'instructions', 1, 32768);
	}
	if (additional_instructions) {
		validated.additional_instructions = validateString(additional_instructions, 'additional_instructions', 1, 32768);
	}
	if (max_tokens !== undefined) {
		validated.max_tokens = validateNumber(max_tokens, 'max_tokens', 1, 4096);
	}
	if (temperature !== undefined) {
		validated.temperature = validateNumber(temperature, 'temperature', 0, 2);
	}
	if (metadata && typeof metadata === 'object') {
		validated.metadata = metadata;
	}

	return validated;
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