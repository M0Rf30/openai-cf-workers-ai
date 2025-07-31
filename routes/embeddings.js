export const embeddingsHandler = async (request, env) => {
	const MODEL_MAPPING = {
		'text-embedding-ada-002': '@cf/baai/bge-base-en-v1.5',
	};

	// Supported Cloudflare models
	const SUPPORTED_MODELS = [
		'@cf/baai/bge-base-en-v1.5',
		'@cf/baai/bge-small-en-v1.5',
		'@cf/baai/bge-large-en-v1.5',
	];

	// Model dimensions for token counting approximation
	const MODEL_DIMENSIONS = {
		'@cf/baai/bge-base-en-v1.5': 768,
		'@cf/baai/bge-small-en-v1.5': 384,
		'@cf/baai/bge-large-en-v1.5': 1024,
	};

	let model = '@cf/baai/bge-base-en-v1.5';
	let pooling = 'mean';
	let error = null;

	try {
		// Check for proper content type
		if (request.headers.get('Content-Type') !== 'application/json') {
			return Response.json({ error: 'Content-Type must be application/json', usage: { prompt_tokens: 0, total_tokens: 0 } }, { status: 400 });
		}

		const json = await request.json();

		// Validate required fields
		if (!json.input) {
			return Response.json({ error: 'Missing required field: input', usage: { prompt_tokens: 0, total_tokens: 0 } }, { status: 400 });
		}

		// Handle model selection
		let cfModel = MODEL_MAPPING[json.model] || json.model;
		if (cfModel && SUPPORTED_MODELS.includes(cfModel)) {
			model = cfModel;
		} else if (json.model && !SUPPORTED_MODELS.includes(json.model)) {
			return Response.json(
				{
					error: `Model "${json.model}" not supported. Available models: ${SUPPORTED_MODELS.join(', ')}`,
					usage: { prompt_tokens: 0, total_tokens: 0 }
				},
				{ status: 400 }
			);
		}

		// Handle pooling method (Cloudflare specific feature)
		if (json.pooling && ['mean', 'cls'].includes(json.pooling)) {
			pooling = json.pooling;
		}

		// Prepare input text
		let inputText = json.input;
		let isArray = Array.isArray(inputText);

		// Ensure input is in the correct format
		if (typeof inputText === 'string') {
			inputText = [inputText];
		} else if (!Array.isArray(inputText)) {
			return Response.json(
				{ error: 'Input must be a string or array of strings', usage: { prompt_tokens: 0, total_tokens: 0 } },
				{ status: 400 }
			);
		}

		// Validate input length
		if (inputText.length === 0) {
			return Response.json({ error: 'Input cannot be empty', usage: { prompt_tokens: 0, total_tokens: 0 } }, { status: 400 });
		}

		// Check for batch size limits (Cloudflare supports up to 100 items)
		if (inputText.length > 100) {
			return Response.json({ error: 'Batch size cannot exceed 100 items', usage: { prompt_tokens: 0, total_tokens: 0 } }, { status: 400 });
		}

		// Validate each text item
		for (const text of inputText) {
			if (typeof text !== 'string' || text.trim().length === 0) {
				return Response.json(
					{ error: 'All input items must be non-empty strings', usage: { prompt_tokens: 0, total_tokens: 0 } },
					{ status: 400 }
				);
			}
		}

		// Call Cloudflare Workers AI
		const embeddings = await env.AI.run(model, {
			text: inputText,
			pooling: pooling,
		});

		// Calculate approximate token usage
		const totalTokens = inputText.reduce((sum, text) => sum + Math.ceil(text.length / 4), 0);

		// Format response to match OpenAI API structure
		const data = embeddings.data.map((embedding, index) => ({
			object: 'embedding',
			embedding: embedding,
			index: index,
		}));

		return Response.json({
			object: 'list',
			data: data,
			model: json.model || model,
			usage: {
				prompt_tokens: totalTokens,
				total_tokens: totalTokens,
			},
		});
	} catch (e) {
		error = e;
		console.error('Embeddings error:', e);

		// Handle specific Cloudflare AI errors
		if (e.message?.includes('rate limit')) {
			return Response.json(
				{ error: 'Rate limit exceeded. Please try again later.' },
				{ status: 429 }
			);
		}

		if (e.message?.includes('invalid input')) {
			return Response.json({ error: 'Invalid input format or content' }, { status: 400 });
		}

		return Response.json({ error: error?.message || 'Internal server error', usage: { prompt_tokens: 0, total_tokens: 0 } }, { status: 500 });
	}
};

// Optional: Add a simple health check endpoint
export const healthHandler = async (request, env) => {
	return Response.json({
		status: 'healthy',
		timestamp: new Date().toISOString(),
		models: SUPPORTED_MODELS,
	});
};
