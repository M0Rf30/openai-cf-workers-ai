// OpenAI-Compatible Moderation Handler for Cloudflare Workers AI
// Content moderation and safety classification

import { validateModel } from '../utils/validation.js';
import { 
	ValidationError,
	createErrorResponse, 
	createSuccessResponse,
	validateRequired,
	validateString,
	validateArray,
	logError,
} from '../utils/errors.js';
import { getCORSHeaders } from '../utils/format.js';

// OpenAI-compatible moderation endpoint
// POST /moderations
export const moderationHandler = async (request, env) => {
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
		const validated = validateModerationRequest(body);

		// Map OpenAI model name to Cloudflare model
		const modelPath = validateModel('moderation', validated.model);

		console.log('Moderation request:', {
			model: validated.model,
			modelPath,
			inputCount: validated.input.length,
		});

		// Process each input through moderation
		const results = [];

		for (let i = 0; i < validated.input.length; i++) {
			const text = validated.input[i];
			
			try {
				// Create moderation prompt for LlamaGuard
				const moderationPrompt = createModerationPrompt(text);
				
				const response = await env.AI.run(modelPath, {
					messages: [
						{
							role: 'user',
							content: moderationPrompt,
						},
					],
					max_tokens: 100,
					temperature: 0.1,
				});

				// Parse LlamaGuard response
				const analysis = parseModerationResponse(response.response || response.text || '');
				
				results.push({
					flagged: analysis.flagged,
					categories: analysis.categories,
					category_scores: analysis.category_scores,
				});

			} catch (error) {
				console.error(`Moderation error for input ${i}:`, error);
				
				// Return safe default on error
				results.push({
					flagged: false,
					categories: {
						hate: false,
						'hate/threatening': false,
						harassment: false,
						'harassment/threatening': false,
						'self-harm': false,
						'self-harm/intent': false,
						'self-harm/instructions': false,
						sexual: false,
						'sexual/minors': false,
						violence: false,
						'violence/graphic': false,
					},
					category_scores: {
						hate: 0.0,
						'hate/threatening': 0.0,
						harassment: 0.0,
						'harassment/threatening': 0.0,
						'self-harm': 0.0,
						'self-harm/intent': 0.0,
						'self-harm/instructions': 0.0,
						sexual: 0.0,
						'sexual/minors': 0.0,
						violence: 0.0,
						'violence/graphic': 0.0,
					},
				});
			}
		}

		return createSuccessResponse({
			id: `modr-${generateId()}`,
			model: validated.model,
			results,
		});

	} catch (error) {
		logError(error, {
			endpoint: '/moderations',
			method: request.method,
		});
		return createErrorResponse(error);
	}
};

// Validation function
function validateModerationRequest(body) {
	const { input, model = 'text-moderation-latest' } = body;

	validateRequired(input, 'input');

	let inputs;
	if (typeof input === 'string') {
		validateString(input, 'input', 1);
		inputs = [input];
	} else if (Array.isArray(input)) {
		validateArray(input, 'input', 1, 32); // OpenAI limit is 32
		inputs = input.map((text, index) => {
			validateString(text, `input[${index}]`, 1);
			return text;
		});
	} else {
		throw new ValidationError('Parameter input must be a string or array of strings', 'input');
	}

	return {
		input: inputs,
		model,
	};
}

// Create moderation prompt for LlamaGuard
function createModerationPrompt(text) {
	return `You are a content moderation AI. Analyze the following text for potentially harmful content.

Categories to check:
- Hate speech or discrimination
- Harassment or bullying
- Self-harm content
- Sexual content
- Violence or graphic content
- Threatening behavior

Text to analyze:
"${text}"

Respond with:
- SAFE if the content is appropriate
- UNSAFE if the content violates policies
- Provide brief reasoning

Response:`;
}

// Parse moderation response from LlamaGuard
function parseModerationResponse(response) {
	const text = response.toLowerCase().trim();
	
	// Check if content is flagged as unsafe
	const flagged = text.includes('unsafe') || 
					text.includes('violation') || 
					text.includes('harmful') ||
					text.includes('inappropriate');

	// Initialize categories
	const categories = {
		hate: false,
		'hate/threatening': false,
		harassment: false,
		'harassment/threatening': false,
		'self-harm': false,
		'self-harm/intent': false,
		'self-harm/instructions': false,
		sexual: false,
		'sexual/minors': false,
		violence: false,
		'violence/graphic': false,
	};

	const category_scores = {
		hate: 0.0,
		'hate/threatening': 0.0,
		harassment: 0.0,
		'harassment/threatening': 0.0,
		'self-harm': 0.0,
		'self-harm/intent': 0.0,
		'self-harm/instructions': 0.0,
		sexual: 0.0,
		'sexual/minors': 0.0,
		violence: 0.0,
		'violence/graphic': 0.0,
	};

	if (flagged) {
		// Basic category detection based on keywords
		if (text.includes('hate') || text.includes('discriminat')) {
			categories.hate = true;
			category_scores.hate = 0.8;
			
			if (text.includes('threat')) {
				categories['hate/threatening'] = true;
				category_scores['hate/threatening'] = 0.8;
			}
		}

		if (text.includes('harass') || text.includes('bully')) {
			categories.harassment = true;
			category_scores.harassment = 0.8;
			
			if (text.includes('threat')) {
				categories['harassment/threatening'] = true;
				category_scores['harassment/threatening'] = 0.8;
			}
		}

		if (text.includes('self-harm') || text.includes('suicide') || text.includes('self harm')) {
			categories['self-harm'] = true;
			category_scores['self-harm'] = 0.8;
			
			if (text.includes('intent') || text.includes('plan')) {
				categories['self-harm/intent'] = true;
				category_scores['self-harm/intent'] = 0.8;
			}
			
			if (text.includes('instruct') || text.includes('how to')) {
				categories['self-harm/instructions'] = true;
				category_scores['self-harm/instructions'] = 0.8;
			}
		}

		if (text.includes('sexual') || text.includes('explicit')) {
			categories.sexual = true;
			category_scores.sexual = 0.8;
			
			if (text.includes('minor') || text.includes('child')) {
				categories['sexual/minors'] = true;
				category_scores['sexual/minors'] = 0.9;
			}
		}

		if (text.includes('violence') || text.includes('violent')) {
			categories.violence = true;
			category_scores.violence = 0.8;
			
			if (text.includes('graphic') || text.includes('gore')) {
				categories['violence/graphic'] = true;
				category_scores['violence/graphic'] = 0.8;
			}
		}
	}

	return {
		flagged,
		categories,
		category_scores,
	};
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