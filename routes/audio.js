// OpenAI-Compatible Audio Handler for Cloudflare Workers AI
// Supports both TTS and STT with dynamic model selection

import { storeFile, getFile, createCachedResponse } from '../utils/r2Storage.js';

import { MODEL_CATEGORIES, MODEL_MAPPING } from '../utils/models.js';

// Available Cloudflare Workers AI models
const AVAILABLE_MODELS = {
	stt: MODEL_CATEGORIES.audio_stt,
	tts: MODEL_CATEGORIES.audio_tts,
	translation: MODEL_CATEGORIES.audio_translation,
	language_detection: MODEL_CATEGORIES.audio_language_detection,
};

// OpenAI-compatible voices for TTS (mapped to language codes for MeloTTS)
const VOICE_MAPPING = {
	alloy: 'en',
	echo: 'fr',
	fable: 'en',
};

const VOICES = Object.keys(VOICE_MAPPING);

// Utility function to validate model and convert to Cloudflare format
function validateModel(type, modelName) {
	// First try to map OpenAI model names to Cloudflare paths
	const cloudflareModel = MODEL_MAPPING[modelName] || modelName;

	if (!AVAILABLE_MODELS[type] || !AVAILABLE_MODELS[type].includes(cloudflareModel)) {
		// Get available OpenAI-compatible model names for error message
		const availableOpenAINames = Object.keys(MODEL_MAPPING).filter(key => {
			const cfModel = MODEL_MAPPING[key];
			return AVAILABLE_MODELS[type]?.includes(cfModel);
		});
		const allAvailable = [...availableOpenAINames, ...AVAILABLE_MODELS[type]];

		throw new Error(
			`Invalid ${type} model: ${modelName}. Available models: ${allAvailable.join(', ')}`,
		);
	}
	return cloudflareModel;
}

// Utility function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer) {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) {
		binary += String.fromCharCode(bytes[i]);
	}
	return btoa(binary);
}

// Utility function to extract language ID from LLM response
function getLanguageId(text) {
	text = text.toLowerCase().trim();
	if (text.includes('\n')) {
		return text.split('\n')[0];
	} else if (text.includes(' ')) {
		return text.split(' ')[0];
	} else {
		return text;
	}
}

// OpenAI-compatible transcription handler
// POST /audio/transcriptions
export const transcriptionHandler = async (request, env) => {
	try {
		// Check content type
		if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
			return Response.json(
				{
					error: {
						message: 'Content-Type must be multipart/form-data',
						type: 'invalid_request_error',
					},
				},
				{ status: 400 },
			);
		}

		const formData = await request.formData();

		// OpenAI-compatible parameters
		const file = formData.get('file');
		const model = formData.get('model') || 'whisper-1';
		const prompt = formData.get('prompt'); // Optional context
		const response_format = formData.get('response_format') || 'json';
		const temperature = formData.get('temperature') ? parseFloat(formData.get('temperature')) : 0;
		const language = formData.get('language'); // Optional language hint
		const timestamp_granularities = formData.get('timestamp_granularities'); // 'word' or 'segment'

		if (!file) {
			return Response.json(
				{
					error: {
						message: 'No audio file provided',
						type: 'invalid_request_error',
					},
				},
				{ status: 400 },
			);
		}

		// Validate model
		const modelPath = validateModel('stt', model);

		// Convert audio to required format for Cloudflare Whisper
		const blob = await file.arrayBuffer();

		// Prepare input based on model type
		let input;
		if (modelPath === '@cf/openai/whisper-large-v3-turbo') {
			// For whisper-large-v3-turbo, use base64 format
			input = {
				audio: arrayBufferToBase64(blob),
			};

			// Add optional parameters supported by whisper-large-v3-turbo
			if (language) {
				input.language = language;
			}
			if (prompt) {
				input.prompt = prompt;
			}
			if (temperature !== undefined && temperature !== 0) {
				input.temperature = temperature;
			}
			// Add timestamp granularities if specified
			if (timestamp_granularities) {
				input.timestamp_granularities = [timestamp_granularities];
			}
		} else {
			// For older whisper models, use array format
			input = {
				audio: [...new Uint8Array(blob)],
			};
		}

		const response = await env.AI.run(modelPath, input);

		// Handle different response formats based on model
		let transcriptionText = '';
		let words = [];
		let segments = [];

		if (modelPath === '@cf/openai/whisper-large-v3-turbo') {
			// whisper-large-v3-turbo returns OpenAI-compatible format
			transcriptionText = response.text || '';

			// Handle word-level timestamps
			if (response.words && Array.isArray(response.words)) {
				words = response.words.map(wordData => ({
					word: wordData.word,
					start: wordData.start,
					end: wordData.end,
				}));
			}

			// Handle segment-level timestamps
			if (response.segments && Array.isArray(response.segments)) {
				segments = response.segments.map(segmentData => ({
					id: segmentData.id,
					start: segmentData.start,
					end: segmentData.end,
					text: segmentData.text,
				}));
			}
		} else {
			// Older whisper models format
			transcriptionText = response.text || '';

			// Handle legacy format with word_count, words, vtt
			if (response.words && Array.isArray(response.words)) {
				words = response.words.map(wordData => ({
					word: wordData.word,
					start: wordData.start,
					end: wordData.end,
				}));
			}
		}

		// Format response based on response_format
		switch (response_format) {
		case 'json': {
			// OpenAI compatible response format
			const jsonResponse = {
				text: transcriptionText,
			};

			// Add word-level timestamps if requested and available
			if (timestamp_granularities === 'word' && words.length > 0) {
				jsonResponse.words = words;
			}

			// Add segments if available or create from words
			if (timestamp_granularities === 'segment') {
				if (segments.length > 0) {
					jsonResponse.segments = segments;
				} else if (words.length > 0) {
					// Create basic segments from words (group by sentences or time chunks)
					const createdSegments = [];
					let currentSegment = {
						id: 0,
						start: words[0].start,
						end: words[0].end,
						text: '',
					};

					words.forEach((wordData, index) => {
						currentSegment.text += (currentSegment.text ? ' ' : '') + wordData.word;
						currentSegment.end = wordData.end;

						// Create new segment on sentence end or every 10 words
						if (
							wordData.word.endsWith('.') ||
								wordData.word.endsWith('!') ||
								wordData.word.endsWith('?') ||
								index % 10 === 9 ||
								index === words.length - 1
						) {
							createdSegments.push({ ...currentSegment });
							if (index < words.length - 1) {
								currentSegment = {
									id: createdSegments.length,
									start: words[index + 1].start,
									end: words[index + 1].end,
									text: '',
								};
							}
						}
					});

					jsonResponse.segments = createdSegments;
				}
			}

			return Response.json(jsonResponse);
		}
		case 'text':
			return new Response(transcriptionText, {
				headers: { 'Content-Type': 'text/plain' },
			});

		case 'srt': {
			// Convert to SRT format using word timings or segments
			const srtSegments = segments.length > 0 ? segments : createSegmentsFromWords(words);
			if (srtSegments.length > 0) {
				let srtContent = '';
				srtSegments.forEach((segment, index) => {
					const startTime = formatSRTTime(segment.start);
					const endTime = formatSRTTime(segment.end);
					srtContent += `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n\n`;
				});
				return new Response(srtContent, {
					headers: { 'Content-Type': 'text/plain' },
				});
			}
			return new Response(transcriptionText, {
				headers: { 'Content-Type': 'text/plain' },
			});
		}
		case 'vtt': {
			// Use existing VTT output or create from segments/words
			if (response.vtt) {
				return new Response(response.vtt, {
					headers: { 'Content-Type': 'text/vtt' },
				});
			} else {
				const vttSegments = segments.length > 0 ? segments : createSegmentsFromWords(words);
				if (vttSegments.length > 0) {
					let vttContent = 'WEBVTT\n\n';
					vttSegments.forEach(segment => {
						const startTime = formatVTTTime(segment.start);
						const endTime = formatVTTTime(segment.end);
						vttContent += `${startTime} --> ${endTime}\n${segment.text}\n\n`;
					});
					return new Response(vttContent, {
						headers: { 'Content-Type': 'text/vtt' },
					});
				}
			}
			return new Response(transcriptionText, {
				headers: { 'Content-Type': 'text/plain' },
			});
		}

		case 'verbose_json': {
			// Return detailed response with all available information
			const verboseResponse = {
				task: 'transcribe',
				language: response.language || 'en',
				duration: response.duration || 0,
				text: transcriptionText,
			};

			if (words.length > 0) {
				verboseResponse.words = words;
			}

			if (segments.length > 0) {
				verboseResponse.segments = segments;
			}

			return Response.json(verboseResponse);
		}

		default:
			return Response.json({
				text: transcriptionText,
			});
		}
	} catch (error) {
		console.error('Transcription Error:', error);
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'server_error',
				},
			},
			{ status: 500 },
		);
	}
};

// Helper function to create segments from words
function createSegmentsFromWords(words) {
	if (!words || words.length === 0) return [];

	const segments = [];
	let currentSegment = {
		id: 0,
		start: words[0].start,
		end: words[0].end,
		text: '',
	};

	words.forEach((wordData, index) => {
		currentSegment.text += (currentSegment.text ? ' ' : '') + wordData.word;
		currentSegment.end = wordData.end;

		// Create new segment on sentence end or every 10 words
		if (
			wordData.word.endsWith('.') ||
			wordData.word.endsWith('!') ||
			wordData.word.endsWith('?') ||
			index % 10 === 9 ||
			index === words.length - 1
		) {
			segments.push({ ...currentSegment });
			if (index < words.length - 1) {
				currentSegment = {
					id: segments.length,
					start: words[index + 1].start,
					end: words[index + 1].end,
					text: '',
				};
			}
		}
	});

	return segments;
}

// OpenAI-compatible translation handler
// POST /audio/translations
export const translationHandler = async (request, env) => {
	try {
		if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
			return Response.json(
				{
					error: {
						message: 'Content-Type must be multipart/form-data',
						type: 'invalid_request_error',
					},
				},
				{ status: 400 },
			);
		}

		const formData = await request.formData();

		// OpenAI-compatible parameters
		const file = formData.get('file');
		const model = formData.get('model') || 'whisper-1';
		const prompt = formData.get('prompt'); // Optional context
		const response_format = formData.get('response_format') || 'json';
		const temperature = formData.get('temperature') ? parseFloat(formData.get('temperature')) : 0;

		if (!file) {
			return Response.json(
				{
					error: {
						message: 'No audio file provided',
						type: 'invalid_request_error',
					},
				},
				{ status: 400 },
			);
		}

		// Validate models
		const sttModelPath = validateModel('stt', model);
		const translationModelPath = '@cf/meta/m2m100-1.2b';

		// Step 1: Transcribe audio using Cloudflare Whisper
		const blob = await file.arrayBuffer();

		// Prepare input based on model type
		let transcriptionInput;
		if (sttModelPath === '@cf/openai/whisper-large-v3-turbo') {
			transcriptionInput = {
				audio: arrayBufferToBase64(blob),
			};
			if (prompt) {
				transcriptionInput.prompt = prompt;
			}
			if (temperature !== undefined && temperature !== 0) {
				transcriptionInput.temperature = temperature;
			}
		} else {
			transcriptionInput = {
				audio: [...new Uint8Array(blob)],
			};
		}

		const transcriptionResponse = await env.AI.run(sttModelPath, transcriptionInput);

		// Step 2: Detect language using LLM
		const languageDetectionResponse = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
			messages: [
				{
					role: 'user',
					content:
						"Output one of the following: english, chinese, french, spanish, arabic, russian, german, japanese, portuguese, hindi. Identify the following languages.\nQ:'Hola mi nombre es brian y el tuyo?'",
				},
				{ role: 'assistant', content: 'spanish' },
				{ role: 'user', content: 'Was für ein schönes Baby!' },
				{ role: 'assistant', content: 'german' },
				{ role: 'user', content: transcriptionResponse.text },
			],
		});

		const detectedLanguage = getLanguageId(languageDetectionResponse.response);

		// Step 3: Translate to English (OpenAI translations are always to English)
		let translatedText = transcriptionResponse.text;
		if (detectedLanguage !== 'english') {
			const translationResponse = await env.AI.run(translationModelPath, {
				text: transcriptionResponse.text,
				source_lang: detectedLanguage,
				target_lang: 'english',
			});

			if (!translationResponse.translated_text) {
				console.log({ translationResponse });
				throw new Error('Translation failed');
			}

			translatedText = translationResponse.translated_text;
		}

		// Format response based on response_format
		switch (response_format) {
		case 'json':
			return Response.json({
				text: translatedText,
				language: detectedLanguage,
			});

		case 'text':
			return new Response(translatedText, {
				headers: { 'Content-Type': 'text/plain' },
			});

		case 'srt':
		case 'vtt':
			return new Response(translatedText, {
				headers: { 'Content-Type': 'text/plain' },
			});

		default:
			return Response.json({
				text: translatedText,
			});
		}
	} catch (error) {
		console.error('Translation Error:', error);
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'server_error',
				},
			},
			{ status: 500 },
		);
	}
};

// OpenAI-compatible TTS handler
// POST /audio/speech
export const speechHandler = async (request, env) => {
	try {
		const body = await request.json();

		// OpenAI-compatible parameters
		const { model = 'tts-1', input, voice = 'alloy', response_format = 'mp3' } = body;

		if (!input) {
			return Response.json(
				{
					error: {
						message: 'No input text provided',
						type: 'invalid_request_error',
					},
				},
				{ status: 400 },
			);
		}

		// Validate voice
		if (!VOICES.includes(voice)) {
			return Response.json(
				{
					error: {
						message: `Invalid voice. Must be one of: ${VOICES.join(', ')}`,
						type: 'invalid_request_error',
					},
				},
				{ status: 400 },
			);
		}

		// Validate model
		const modelPath = validateModel('tts', model);

		// Prepare input for Cloudflare Workers AI MeloTTS
		// According to documentation, MeloTTS expects 'prompt' and 'lang' parameters
		const aiInput = {
			prompt: input, // MeloTTS uses 'prompt' not 'text'
			lang: VOICE_MAPPING[voice] || 'en', // Map voice to language code
		};

		// Note: MeloTTS doesn't support speed parameter according to the documentation
		// If speed is needed, it would require post-processing

		// Check if already cached in R2 (for large audio files)
		let audioKey = null;

		if (env.AUDIO_BUCKET) {
			// Generate a cache key based on input parameters
			const cacheKey = await crypto.subtle.digest(
				'SHA-256',
				new TextEncoder().encode(`${model}:${input}:${voice}:${response_format}`),
			);
			const cacheKeyHex = Array.from(new Uint8Array(cacheKey))
				.map(b => b.toString(16).padStart(2, '0'))
				.join('');

			audioKey = `tts/${cacheKeyHex.substring(0, 16)}.mp3`;

			// Check if audio already exists in R2
			const cachedAudio = await getFile(env.AUDIO_BUCKET, audioKey);
			if (cachedAudio) {
				console.log('Returning cached audio from R2');
				return createCachedResponse(cachedAudio, request, { waitUntil: () => {} });
			}
		}

		const response = await env.AI.run(modelPath, aiInput);

		// MeloTTS returns either:
		// 1. JSON with base64-encoded audio: { audio: "base64string" }
		// 2. Direct binary MP3 data

		let audioData;

		// Check if response is JSON with base64 audio
		if (response && typeof response === 'object' && response.audio) {
			// Base64 encoded audio
			audioData = Uint8Array.from(atob(response.audio), c => c.charCodeAt(0));
		} else {
			// Direct binary data
			audioData = response;
		}

		// Determine content type based on response_format
		let contentType = 'audio/mpeg'; // MeloTTS returns MP3 format
		let filename = 'speech.mp3';

		// Note: MeloTTS only supports MP3 output format
		// Other formats would require conversion
		switch (response_format) {
		case 'mp3':
			contentType = 'audio/mpeg';
			filename = 'speech.mp3';
			break;
		case 'opus':
		case 'aac':
		case 'flac':
		case 'wav':
		case 'pcm':
			// MeloTTS only supports MP3, so we return MP3 regardless
			// In a production system, you might want to add audio conversion here
			contentType = 'audio/mpeg';
			filename = 'speech.mp3';
			console.warn(`Format ${response_format} not supported by MeloTTS, returning MP3`);
			break;
		default:
			contentType = 'audio/mpeg';
			filename = 'speech.mp3';
		}

		// Store large audio files in R2 if bucket is available
		if (env.AUDIO_BUCKET && audioKey && audioData.byteLength > 1024 * 1024) {
			// Store files > 1MB
			try {
				await storeFile(env.AUDIO_BUCKET, audioKey, audioData, {
					contentType,
					custom: {
						model,
						input: input.substring(0, 100), // Store truncated input for reference
						voice,
						format: response_format,
					},
				});
				console.log(`Large audio file stored in R2: ${audioKey}`);
			} catch (error) {
				console.error('Failed to store audio in R2:', error);
				// Continue without storing, just serve the file
			}
		}

		// Return audio as blob
		return new Response(audioData, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Cache-Control': 'public, max-age=3600',
			},
		});
	} catch (error) {
		console.error('TTS Error:', error);
		return Response.json(
			{
				error: {
					message: error.message,
					type: 'server_error',
				},
			},
			{ status: 500 },
		);
	}
};

// Models endpoint - OpenAI compatible
export const modelsHandler = async (_request, _env) => {
	const models = [];

	// Add STT models
	AVAILABLE_MODELS.stt.forEach(modelId => {
		models.push({
			id: modelId,
			object: 'model',
			created: Date.now(),
			owned_by: 'cloudflare',
			capabilities: ['transcription', 'translation'],
		});
	});

	// Add TTS models
	AVAILABLE_MODELS.tts.forEach(modelId => {
		models.push({
			id: modelId,
			object: 'model',
			created: Date.now(),
			owned_by: 'cloudflare',
			capabilities: ['text-to-speech'],
		});
	});

	return Response.json({
		object: 'list',
		data: models,
	});
};

// Utility functions for time formatting
function formatSRTTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 1000);

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function formatVTTTime(seconds) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 1000);

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}
