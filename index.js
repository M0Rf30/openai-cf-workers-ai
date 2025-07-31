import { Router, cors, error, json } from 'itty-router';

// Import the routes
import { chatHandler } from './routes/chat.js';
import { completionHandler } from './routes/completion.js';
import { embeddingsHandler } from './routes/embeddings.js';
import { speechHandler, transcriptionHandler, translationHandler } from './routes/audio.js';
import { getImageHandler, imageGenerationHandler } from './routes/image.js';
import { modelsHandler } from './routes/models.js';

// Import new advanced endpoints
import { 
	visionChatHandler, 
	imageAnalysisHandler, 
	imageClassificationHandler 
} from './routes/vision.js';
import { moderationHandler } from './routes/moderation.js';
import { 
	listFineTuningJobsHandler,
	createFineTuningJobHandler,
	getFineTuningJobHandler,
	cancelFineTuningJobHandler,
	listFineTuningEventsHandler,
} from './routes/fine-tuning.js';
import {
	createAssistantHandler,
	listAssistantsHandler,
	getAssistantHandler,
	createThreadHandler,
	createMessageHandler,
	createRunHandler,
	listMessagesHandler,
} from './routes/assistants.js';

// Get preflight and corsify pair
const { preflight, corsify } = cors();

// Create a new router
const router = Router({ base: '/v1' });

function extractToken(authorizationHeader) {
	if (authorizationHeader) {
		const parts = authorizationHeader.split(' ');
		if (parts.length === 2 && parts[0] === 'Bearer') {
			return parts[1];
		}
	}
	return null;
}

// MIDDLEWARE: Bearer token authentication
const bearerAuthentication = (request, env) => {
	// Skip auth for OPTIONS requests (CORS preflight)
	if (request.method === 'OPTIONS') {
		return;
	}
	
	const authorizationHeader = request.headers.get('Authorization');
	if (!authorizationHeader) {
		return error(401, 'Unauthorized');
	}
	const access_token = extractToken(authorizationHeader);
	if (env.ACCESS_TOKEN !== access_token) {
		return error(403, 'Forbidden');
	}
};

// Apply CORS middleware
router.all('*', preflight);

// Apply authentication middleware
router.all('*', bearerAuthentication);

// Core OpenAI API endpoints
router
	// Chat & Completions
	.post('/chat/completions', chatHandler)
	.post('/completions', completionHandler)
	
	// Embeddings
	.post('/embeddings', embeddingsHandler)
	
	// Audio endpoints
	.post('/audio/speech', speechHandler)
	.post('/audio/transcriptions', transcriptionHandler)
	.post('/audio/translations', translationHandler)
	
	// Image endpoints
	.post('/images/generations', imageGenerationHandler)
	.get('/images/get/:name', getImageHandler)
	
	// Vision endpoints (NEW)
	.post('/images/analyze', imageAnalysisHandler)
	.post('/images/classify', imageClassificationHandler)
	
	// Moderation (NEW)
	.post('/moderations', moderationHandler)
	
	// Fine-tuning endpoints (NEW)
	.get('/fine_tuning/jobs', listFineTuningJobsHandler)
	.post('/fine_tuning/jobs', createFineTuningJobHandler)
	.get('/fine_tuning/jobs/:id', getFineTuningJobHandler)
	.post('/fine_tuning/jobs/:id/cancel', cancelFineTuningJobHandler)
	.get('/fine_tuning/jobs/:id/events', listFineTuningEventsHandler)
	
	// Assistants API (NEW)
	.post('/assistants', createAssistantHandler)
	.get('/assistants', listAssistantsHandler)
	.get('/assistants/:id', getAssistantHandler)
	.post('/threads', createThreadHandler)
	.post('/threads/:id/messages', createMessageHandler)
	.post('/threads/:id/runs', createRunHandler)
	.get('/threads/:id/messages', listMessagesHandler)
	
	// Models endpoint
	.get('/models', modelsHandler);

// Handle vision-enabled chat completions
// This checks if the request contains vision content and routes accordingly
const originalChatHandler = router.routes.find(route => 
	route.method === 'POST' && route.path === '/chat/completions'
)?.handler;

if (originalChatHandler) {
	router.routes = router.routes.filter(route => 
		!(route.method === 'POST' && route.path === '/chat/completions')
	);
	
	router.post('/chat/completions', async (request, env, ctx) => {
		try {
			// Check if request contains vision content
			const contentType = request.headers.get('Content-Type');
			if (contentType?.includes('application/json')) {
				const body = await request.json();
				
				// Check if any message contains vision content
				const hasVisionContent = body.messages?.some(message => 
					Array.isArray(message.content) && 
					message.content.some(item => item.type === 'image_url')
				);
				
				if (hasVisionContent) {
					// Route to vision handler
					const visionRequest = new Request(request.url, {
						method: request.method,
						headers: request.headers,
						body: JSON.stringify(body),
					});
					return visionChatHandler(visionRequest, env, ctx);
				} else {
					// Route to regular chat handler
					const chatRequest = new Request(request.url, {
						method: request.method,
						headers: request.headers,
						body: JSON.stringify(body),
					});
					return chatHandler(chatRequest, env, ctx);
				}
			}
		} catch (error) {
			console.error('Error routing chat request:', error);
			// Fallback to regular chat handler
			return chatHandler(request, env, ctx);
		}
		
		// Fallback to regular chat handler
		return chatHandler(request, env, ctx);
	});
}

// 404 for everything else
router.all('*', () => new Response('404, not found!', { status: 404 }));

// Export with CORS
export default corsify(router);
