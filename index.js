import { Router, error } from 'itty-router';

// import the routes
import { chatHandler } from './routes/chat';
import { completionHandler } from './routes/completion';
import { embeddingsHandler } from './routes/embeddings';
import { transcriptionHandler, translationHandler, speechHandler } from './routes/audio';
import { getImageHandler, imageGenerationHandler } from './routes/image';
import { modelsHandler } from './routes/models';
import { storeDocumentHandler, ragSearchHandler, ragChatHandler } from './routes/rag';

// import utilities
import { DistributedRateLimiter } from './utils/DistributedRateLimiter';

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

// MIDDLEWARE: withAuthenticatedUser - embeds user in Request or returns a 401
const bearerAuthentication = (request, env) => {
	const authorizationHeader = request.headers.get('Authorization');
	if (!authorizationHeader) {
		return error(401, 'Unauthorized');
	}
	const access_token = extractToken(authorizationHeader);
	if (env.ACCESS_TOKEN !== access_token) {
		return error(403, 'Forbidden');
	}
};

router
	// .all('*', rateLimit) // Rate limiting disabled
	.all('*', bearerAuthentication)
	.post('/chat/completions', chatHandler)
	.post('/completions', completionHandler)
	.post('/embeddings', embeddingsHandler)
	.post('/audio/transcriptions', transcriptionHandler)
	.post('/audio/translations', translationHandler)
	.post('/audio/speech', speechHandler)
	.post('/images/generations', imageGenerationHandler)
	.get('/images/get/:name', getImageHandler)
	.get('/models', modelsHandler)
	// RAG endpoints
	.post('/rag/documents', storeDocumentHandler)
	.post('/rag/search', ragSearchHandler)
	.post('/rag/chat', ragChatHandler);

// 404 for everything else
router.all('*', () => new Response('404, not found!', { status: 404 }));

// Export the Durable Object
export { DistributedRateLimiter };

export default router;
