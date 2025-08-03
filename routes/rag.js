import { processAndStoreDocument, performRAGSearch } from '../utils/vectorize.js';

/**
 * Handler for storing documents in Vectorize for RAG
 */
export const storeDocumentHandler = async (request, env) => {
	try {
		if (request.headers.get('Content-Type') !== 'application/json') {
			return Response.json({ error: 'Content-Type must be application/json' }, { status: 400 });
		}

		const body = await request.json();

		if (!body.text) {
			return Response.json({ error: 'Missing required field: text' }, { status: 400 });
		}

		if (!body.metadata?.docId) {
			return Response.json({ error: 'Missing required field: metadata.docId' }, { status: 400 });
		}

		const options = {
			model: body.model || '@cf/baai/bge-base-en-v1.5',
			chunkSize: body.chunkSize || 1000,
			chunkOverlap: body.chunkOverlap || 200,
			namespace: body.namespace || 'documents',
		};

		const result = await processAndStoreDocument(env, body.text, body.metadata, options);

		return Response.json({
			success: true,
			document_id: result.documentId,
			chunks_processed: result.chunksProcessed,
			vectors_stored: result.vectorsStored,
		});
	} catch (error) {
		console.error('Store document error:', error);
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'processing_error',
				},
			},
			{ status: 500 }
		);
	}
};

/**
 * Handler for RAG search
 */
export const ragSearchHandler = async (request, env) => {
	try {
		if (request.headers.get('Content-Type') !== 'application/json') {
			return Response.json({ error: 'Content-Type must be application/json' }, { status: 400 });
		}

		const body = await request.json();

		if (!body.query) {
			return Response.json({ error: 'Missing required field: query' }, { status: 400 });
		}

		const options = {
			model: body.model || '@cf/baai/bge-base-en-v1.5',
			topK: body.top_k || 5,
			scoreThreshold: body.score_threshold || 0.7,
			namespace: body.namespace || 'documents',
		};

		const result = await performRAGSearch(env, body.query, options);

		return Response.json({
			query: result.query,
			context: result.context,
			sources: result.sources,
		});
	} catch (error) {
		console.error('RAG search error:', error);
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'search_error',
				},
			},
			{ status: 500 }
		);
	}
};

/**
 * Handler for RAG-enhanced chat completions
 */
export const ragChatHandler = async (request, env) => {
	try {
		if (request.headers.get('Content-Type') !== 'application/json') {
			return Response.json({ error: 'Content-Type must be application/json' }, { status: 400 });
		}

		const body = await request.json();

		if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
			return Response.json({ error: 'Missing or invalid messages array' }, { status: 400 });
		}

		// Get the last user message for RAG search
		const lastMessage = body.messages[body.messages.length - 1];
		if (lastMessage.role !== 'user') {
			return Response.json({ error: 'Last message must be from user' }, { status: 400 });
		}

		// Perform RAG search
		const ragOptions = {
			model: body.embedding_model || '@cf/baai/bge-base-en-v1.5',
			topK: body.rag_top_k || 3,
			scoreThreshold: body.rag_score_threshold || 0.7,
			namespace: body.namespace || 'documents',
		};

		const ragResult = await performRAGSearch(env, lastMessage.content, ragOptions);

		// Enhance the conversation with RAG context
		const enhancedMessages = [...body.messages];

		// Add context as a system message or enhance the last user message
		if (ragResult.context) {
			const contextMessage = {
				role: 'system',
				content: `Use the following context to help answer the user's question. If the context doesn't contain relevant information, you can still use your general knowledge.

Context:
${ragResult.context}

Sources: ${ragResult.sources.length} relevant documents found.`,
			};

			// Insert context before the last message
			enhancedMessages.splice(-1, 0, contextMessage);
		}

		// Forward to regular chat handler with enhanced messages
		const chatRequest = new Request(request.url.replace('/v1/rag/chat', '/v1/chat/completions'), {
			method: 'POST',
			headers: request.headers,
			body: JSON.stringify({
				...body,
				messages: enhancedMessages,
			}),
		});

		// Import and call the regular chat handler
		const { chatHandler } = await import('./chat.js');
		const response = await chatHandler(chatRequest, env);

		// Add RAG metadata to the response
		if (response.ok) {
			const chatResponse = await response.json();
			chatResponse.rag_sources = ragResult.sources;
			return Response.json(chatResponse);
		} else {
			return response;
		}
	} catch (error) {
		console.error('RAG chat error:', error);
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'rag_chat_error',
				},
			},
			{ status: 500 }
		);
	}
};
