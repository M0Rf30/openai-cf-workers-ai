// Validation utilities for OpenAI-compatible API parameters

import {
	ValidationError,
	validateRequired,
	validateString,
	validateNumber,
	validateArray,
	validateEnum,
	validateAudioFile,
} from './errors.js';

// Model validation and mapping
export const AVAILABLE_MODELS = {
	chat: [
		'@cf/meta/llama-2-7b-chat-int8',
		'@cf/meta/llama-2-7b-chat-fp16',
		'@cf/mistral/mistral-7b-instruct-v0.1',
		'@cf/microsoft/DialoGPT-medium',
	],
	completion: [
		'@cf/meta/llama-2-7b-chat-int8',
		'@cf/meta/llama-2-7b-chat-fp16',
		'@cf/mistral/mistral-7b-instruct-v0.1',
	],
	embedding: [
		'@cf/baai/bge-base-en-v1.5',
		'@cf/baai/bge-small-en-v1.5',
		'@cf/baai/bge-large-en-v1.5',
	],
	stt: ['@cf/openai/whisper', '@cf/openai/whisper-tiny-en', '@cf/openai/whisper-large-v3-turbo'],
	tts: ['@cf/myshell-ai/melotts'],
	translation: ['@cf/meta/m2m100-1.2b'],
	language_detection: ['@cf/meta/llama-2-7b-chat-int8'],
};

// OpenAI-compatible model name mappings
export const MODEL_MAPPING = {
	// Chat models
	'gpt-3.5-turbo': '@cf/meta/llama-2-7b-chat-int8',
	'gpt-3.5-turbo-16k': '@cf/meta/llama-2-7b-chat-fp16',
	'gpt-4': '@cf/mistral/mistral-7b-instruct-v0.1',
	'gpt-4-turbo': '@cf/mistral/mistral-7b-instruct-v0.1',

	// Completion models
	'gpt-3.5-turbo-instruct': '@cf/meta/llama-2-7b-chat-int8',
	'text-davinci-003': '@cf/meta/llama-2-7b-chat-int8',
	'text-davinci-002': '@cf/meta/llama-2-7b-chat-int8',

	// Embedding models
	'text-embedding-ada-002': '@cf/baai/bge-base-en-v1.5',
	'text-embedding-3-small': '@cf/baai/bge-small-en-v1.5',
	'text-embedding-3-large': '@cf/baai/bge-large-en-v1.5',

	// STT models
	'whisper-1': '@cf/openai/whisper',
	'whisper': '@cf/openai/whisper',
	'whisper-tiny-en': '@cf/openai/whisper-tiny-en',
	'whisper-large-v3-turbo': '@cf/openai/whisper-large-v3-turbo',

	// TTS models
	'tts-1': '@cf/myshell-ai/melotts',
	'tts-1-hd': '@cf/myshell-ai/melotts',
};

// Voice mappings for TTS
export const VOICE_MAPPING = {
	alloy: 'it',
	echo: 'fr',
	fable: 'en',
	onyx: 'en',
	nova: 'en',
	shimmer: 'en',
};

export const AVAILABLE_VOICES = Object.keys(VOICE_MAPPING);

// Response format validation
export const RESPONSE_FORMATS = {
	transcription: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
	translation: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
	tts: ['mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'],
};

// Utility function to validate and convert model names
export function validateModel(type, modelName) {
	validateRequired(modelName, 'model');
	validateString(modelName, 'model');

	// Try to map OpenAI model names to Cloudflare paths
	const cloudflareModel = MODEL_MAPPING[modelName] || modelName;

	if (!AVAILABLE_MODELS[type] || !AVAILABLE_MODELS[type].includes(cloudflareModel)) {
		// Get available OpenAI-compatible model names for error message
		const availableOpenAINames = Object.keys(MODEL_MAPPING).filter(key => {
			const cfModel = MODEL_MAPPING[key];
			return AVAILABLE_MODELS[type]?.includes(cfModel);
		});
		const allAvailable = [...availableOpenAINames, ...(AVAILABLE_MODELS[type] || [])];

		throw new ValidationError(
			`Invalid ${type} model: ${modelName}. Available models: ${allAvailable.join(', ')}`,
			'model',
		);
	}

	return cloudflareModel;
}

// Chat completion validation
export function validateChatCompletionRequest(body) {
	const {
		model,
		messages,
		max_tokens,
		temperature,
		top_p,
		n,
		stream,
		stop,
		presence_penalty,
		frequency_penalty,
		user,
	} = body;

	// Required parameters
	validateRequired(model, 'model');
	validateRequired(messages, 'messages');

	// Validate model
	const validatedModel = validateModel('chat', model);

	// Validate messages
	validateArray(messages, 'messages', 1);
	messages.forEach((message, index) => {
		if (!message.role || !message.content) {
			throw new ValidationError(
				`Message at index ${index} must have 'role' and 'content' properties`,
				'messages',
			);
		}
		validateEnum(message.role, `messages[${index}].role`, ['system', 'user', 'assistant']);
		validateString(message.content, `messages[${index}].content`);
	});

	// Optional parameter validation
	const validated = { model: validatedModel, messages };

	if (max_tokens !== undefined) {
		validated.max_tokens = validateNumber(max_tokens, 'max_tokens', 1, 4096);
	}

	if (temperature !== undefined) {
		validated.temperature = validateNumber(temperature, 'temperature', 0, 2);
	}

	if (top_p !== undefined) {
		validated.top_p = validateNumber(top_p, 'top_p', 0, 1);
	}

	if (n !== undefined) {
		validated.n = validateNumber(n, 'n', 1, 128);
	}

	if (stream !== undefined) {
		validated.stream = Boolean(stream);
	}

	if (stop !== undefined) {
		if (typeof stop === 'string') {
			validated.stop = [stop];
		} else if (Array.isArray(stop)) {
			validateArray(stop, 'stop', 0, 4);
			validated.stop = stop;
		} else {
			throw new ValidationError('Parameter stop must be a string or array', 'stop');
		}
	}

	if (presence_penalty !== undefined) {
		validated.presence_penalty = validateNumber(presence_penalty, 'presence_penalty', -2, 2);
	}

	if (frequency_penalty !== undefined) {
		validated.frequency_penalty = validateNumber(frequency_penalty, 'frequency_penalty', -2, 2);
	}

	if (user !== undefined) {
		validated.user = validateString(user, 'user', 0, 256);
	}

	return validated;
}

// Embedding validation
export function validateEmbeddingRequest(body) {
	const { input, model, encoding_format, dimensions, user } = body;

	validateRequired(input, 'input');

	// Validate input
	let inputs;
	if (typeof input === 'string') {
		validateString(input, 'input', 1);
		inputs = [input];
	} else if (Array.isArray(input)) {
		validateArray(input, 'input', 1, 2048);
		inputs = input.map((text, index) => {
			validateString(text, `input[${index}]`, 1);
			return text;
		});
	} else {
		throw new ValidationError('Parameter input must be a string or array of strings', 'input');
	}

	// Validate model
	const validatedModel = model ? validateModel('embedding', model) : AVAILABLE_MODELS.embedding[0];

	const validated = {
		input: inputs,
		model: validatedModel,
	};

	if (encoding_format !== undefined) {
		validated.encoding_format = validateEnum(encoding_format, 'encoding_format', [
			'float',
			'base64',
		]);
	}

	if (dimensions !== undefined) {
		validated.dimensions = validateNumber(dimensions, 'dimensions', 1, 3072);
	}

	if (user !== undefined) {
		validated.user = validateString(user, 'user', 0, 256);
	}

	return validated;
}

// Audio transcription validation
export function validateTranscriptionRequest(formData) {
	const file = formData.get('file');
	const model = formData.get('model') || 'whisper-1';
	const prompt = formData.get('prompt');
	const response_format = formData.get('response_format') || 'json';
	const temperature = formData.get('temperature');
	const language = formData.get('language');
	const timestamp_granularities = formData.get('timestamp_granularities');

	// Validate required parameters
	validateAudioFile(file);
	const validatedModel = validateModel('stt', model);

	const validated = {
		file,
		model: validatedModel,
	};

	// Optional parameters
	if (prompt) {
		validated.prompt = validateString(prompt, 'prompt', 0, 244);
	}

	if (response_format) {
		validated.response_format = validateEnum(
			response_format,
			'response_format',
			RESPONSE_FORMATS.transcription,
		);
	}

	if (temperature) {
		validated.temperature = validateNumber(parseFloat(temperature), 'temperature', 0, 1);
	}

	if (language) {
		validated.language = validateString(language, 'language', 2, 2); // ISO 639-1 code
	}

	if (timestamp_granularities) {
		validated.timestamp_granularities = validateEnum(
			timestamp_granularities,
			'timestamp_granularities',
			['word', 'segment'],
		);
	}

	return validated;
}

// Audio translation validation
export function validateTranslationRequest(formData) {
	const file = formData.get('file');
	const model = formData.get('model') || 'whisper-1';
	const prompt = formData.get('prompt');
	const response_format = formData.get('response_format') || 'json';
	const temperature = formData.get('temperature');

	// Validate required parameters
	validateAudioFile(file);
	const validatedModel = validateModel('stt', model);

	const validated = {
		file,
		model: validatedModel,
	};

	// Optional parameters
	if (prompt) {
		validated.prompt = validateString(prompt, 'prompt', 0, 244);
	}

	if (response_format) {
		validated.response_format = validateEnum(
			response_format,
			'response_format',
			RESPONSE_FORMATS.translation,
		);
	}

	if (temperature) {
		validated.temperature = validateNumber(parseFloat(temperature), 'temperature', 0, 1);
	}

	return validated;
}

// Speech synthesis validation
export function validateSpeechRequest(body) {
	const { model, input, voice, response_format, speed } = body;

	// Required parameters
	validateRequired(model, 'model');
	validateRequired(input, 'input');

	const validatedModel = validateModel('tts', model);
	const validatedInput = validateString(input, 'input', 1, 4096);
	const validatedVoice = voice ? validateEnum(voice, 'voice', AVAILABLE_VOICES) : 'alloy';

	const validated = {
		model: validatedModel,
		input: validatedInput,
		voice: validatedVoice,
	};

	// Optional parameters
	if (response_format) {
		validated.response_format = validateEnum(
			response_format,
			'response_format',
			RESPONSE_FORMATS.tts,
		);
	}

	if (speed !== undefined) {
		validated.speed = validateNumber(speed, 'speed', 0.25, 4.0);
	}

	return validated;
}

// Completion validation (legacy)
export function validateCompletionRequest(body) {
	const {
		model,
		prompt,
		max_tokens,
		temperature,
		top_p,
		n,
		stream,
		logprobs,
		echo,
		stop,
		presence_penalty,
		frequency_penalty,
		best_of,
		user,
		suffix,
	} = body;

	// Required parameters
	validateRequired(model, 'model');
	validateRequired(prompt, 'prompt');

	const validatedModel = validateModel('completion', model);

	let validatedPrompt;
	if (typeof prompt === 'string') {
		validatedPrompt = validateString(prompt, 'prompt');
	} else if (Array.isArray(prompt)) {
		validatedPrompt = prompt.map((p, index) => validateString(p, `prompt[${index}]`));
	} else {
		throw new ValidationError('Parameter prompt must be a string or array of strings', 'prompt');
	}

	const validated = {
		model: validatedModel,
		prompt: validatedPrompt,
	};

	// Optional parameters
	if (max_tokens !== undefined) {
		validated.max_tokens = validateNumber(max_tokens, 'max_tokens', 1, 4096);
	}

	if (temperature !== undefined) {
		validated.temperature = validateNumber(temperature, 'temperature', 0, 2);
	}

	if (top_p !== undefined) {
		validated.top_p = validateNumber(top_p, 'top_p', 0, 1);
	}

	if (n !== undefined) {
		validated.n = validateNumber(n, 'n', 1, 128);
	}

	if (stream !== undefined) {
		validated.stream = Boolean(stream);
	}

	if (logprobs !== undefined) {
		validated.logprobs = validateNumber(logprobs, 'logprobs', 0, 5);
	}

	if (echo !== undefined) {
		validated.echo = Boolean(echo);
	}

	if (stop !== undefined) {
		if (typeof stop === 'string') {
			validated.stop = [stop];
		} else if (Array.isArray(stop)) {
			validateArray(stop, 'stop', 0, 4);
			validated.stop = stop;
		} else {
			throw new ValidationError('Parameter stop must be a string or array', 'stop');
		}
	}

	if (presence_penalty !== undefined) {
		validated.presence_penalty = validateNumber(presence_penalty, 'presence_penalty', -2, 2);
	}

	if (frequency_penalty !== undefined) {
		validated.frequency_penalty = validateNumber(frequency_penalty, 'frequency_penalty', -2, 2);
	}

	if (best_of !== undefined) {
		validated.best_of = validateNumber(best_of, 'best_of', 1, 20);
	}

	if (user !== undefined) {
		validated.user = validateString(user, 'user', 0, 256);
	}

	if (suffix !== undefined) {
		validated.suffix = validateString(suffix, 'suffix', 0, 40);
	}

	return validated;
}
