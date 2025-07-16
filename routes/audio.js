// OpenAI-Compatible Audio Handler for Cloudflare Workers AI
// Supports both TTS and STT with dynamic model selection

// Available Cloudflare Workers AI models
const AVAILABLE_MODELS = {
	stt: ['@cf/openai/whisper', '@cf/openai/whisper-tiny-en', '@cf/openai/whisper-large-v3-turbo'],
	tts: ['@cf/myshell-ai/melotts'],
	translation: ['@cf/meta/m2m100-1.2b'],
	language_detection: ['@cf/meta/llama-2-7b-chat-int8'],
};

// OpenAI-compatible voices for TTS (mapped to language codes for MeloTTS)
const VOICE_MAPPING = {
	alloy: 'it',
	echo: 'fr',
	fable: 'en',
};

const VOICES = Object.keys(VOICE_MAPPING);

// Utility function to validate model
function validateModel(type, modelName) {
	if (!AVAILABLE_MODELS[type] || !AVAILABLE_MODELS[type].includes(modelName)) {
		throw new Error(
			`Invalid ${type} model: ${modelName}. Available models: ${AVAILABLE_MODELS[type]?.join(', ')}`
		);
	}
	return modelName;
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
				{ status: 400 }
			);
		}

		const formData = await request.formData();

		// OpenAI-compatible parameters
		const file = formData.get('file');
		const model = formData.get('model') || '@cf/openai/whisper';
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
				{ status: 400 }
			);
		}

		// Validate model
		const modelPath = validateModel('stt', model);

		// Convert audio to required format for Cloudflare Whisper
		const blob = await file.arrayBuffer();
		const input = {
			audio: [...new Uint8Array(blob)],
		};

		// Note: Cloudflare Whisper doesn't support language parameter directly
		// It performs automatic language detection

		const response = await env.AI.run(modelPath, input);

		// Cloudflare Whisper returns: { text, word_count, words, vtt }
		// Where words is an array of { word, start, end }

		// Format response based on response_format
		switch (response_format) {
			case 'json':
				// OpenAI compatible response format
				const jsonResponse = {
					text: response.text,
				};

				// Add word-level timestamps if requested and available
				if (timestamp_granularities === 'word' && response.words) {
					jsonResponse.words = response.words.map(wordData => ({
						word: wordData.word,
						start: wordData.start,
						end: wordData.end,
					}));
				}

				// Add segments if available (Cloudflare doesn't provide segments, but we can simulate)
				if (timestamp_granularities === 'segment' && response.words) {
					// Create basic segments from words (group by sentences or time chunks)
					const segments = [];
					let currentSegment = {
						id: 0,
						start: 0,
						end: 0,
						text: '',
					};

					response.words.forEach((wordData, index) => {
						if (index === 0) {
							currentSegment.start = wordData.start;
						}

						currentSegment.text += (currentSegment.text ? ' ' : '') + wordData.word;
						currentSegment.end = wordData.end;

						// Create new segment on sentence end or every 10 words
						if (
							wordData.word.endsWith('.') ||
							wordData.word.endsWith('!') ||
							wordData.word.endsWith('?') ||
							index % 10 === 9
						) {
							segments.push({ ...currentSegment });
							currentSegment = {
								id: segments.length,
								start: wordData.end,
								end: wordData.end,
								text: '',
							};
						}
					});

					// Add final segment if it has content
					if (currentSegment.text) {
						segments.push(currentSegment);
					}

					jsonResponse.segments = segments;
				}

				return Response.json(jsonResponse);

			case 'text':
				return new Response(response.text, {
					headers: { 'Content-Type': 'text/plain' },
				});

			case 'srt':
				// Convert to SRT format using word timings
				if (response.words && response.words.length > 0) {
					let srtContent = '';
					let segmentIndex = 1;
					let currentSegment = '';
					let segmentStart = response.words[0].start;
					let segmentEnd = response.words[0].end;

					response.words.forEach((wordData, index) => {
						currentSegment += (currentSegment ? ' ' : '') + wordData.word;
						segmentEnd = wordData.end;

						// Create SRT segment every 10 words or at sentence end
						if (
							wordData.word.endsWith('.') ||
							wordData.word.endsWith('!') ||
							wordData.word.endsWith('?') ||
							index % 10 === 9 ||
							index === response.words.length - 1
						) {
							const startTime = formatSRTTime(segmentStart);
							const endTime = formatSRTTime(segmentEnd);

							srtContent += `${segmentIndex}\n${startTime} --> ${endTime}\n${currentSegment}\n\n`;

							segmentIndex++;
							currentSegment = '';
							if (index < response.words.length - 1) {
								segmentStart = response.words[index + 1].start;
							}
						}
					});

					return new Response(srtContent, {
						headers: { 'Content-Type': 'text/plain' },
					});
				}
				return new Response(response.text, {
					headers: { 'Content-Type': 'text/plain' },
				});

			case 'vtt':
				// Use Cloudflare's VTT output if available, otherwise create from words
				if (response.vtt) {
					return new Response(response.vtt, {
						headers: { 'Content-Type': 'text/vtt' },
					});
				} else if (response.words && response.words.length > 0) {
					let vttContent = 'WEBVTT\n\n';
					let segmentIndex = 1;
					let currentSegment = '';
					let segmentStart = response.words[0].start;
					let segmentEnd = response.words[0].end;

					response.words.forEach((wordData, index) => {
						currentSegment += (currentSegment ? ' ' : '') + wordData.word;
						segmentEnd = wordData.end;

						// Create VTT segment every 10 words or at sentence end
						if (
							wordData.word.endsWith('.') ||
							wordData.word.endsWith('!') ||
							wordData.word.endsWith('?') ||
							index % 10 === 9 ||
							index === response.words.length - 1
						) {
							const startTime = formatVTTTime(segmentStart);
							const endTime = formatVTTTime(segmentEnd);

							vttContent += `${startTime} --> ${endTime}\n${currentSegment}\n\n`;

							currentSegment = '';
							if (index < response.words.length - 1) {
								segmentStart = response.words[index + 1].start;
							}
						}
					});

					return new Response(vttContent, {
						headers: { 'Content-Type': 'text/vtt' },
					});
				}
				return new Response(response.text, {
					headers: { 'Content-Type': 'text/plain' },
				});

			default:
				return Response.json({
					text: response.text,
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
			{ status: 500 }
		);
	}
};

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
				{ status: 400 }
			);
		}

		const formData = await request.formData();

		// OpenAI-compatible parameters
		const file = formData.get('file');
		const model = formData.get('model') || '@cf/openai/whisper';
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
				{ status: 400 }
			);
		}

		// Validate models
		const sttModelPath = validateModel('stt', model);
		const translationModelPath = '@cf/meta/m2m100-1.2b';

		// Step 1: Transcribe audio using Cloudflare Whisper
		const blob = await file.arrayBuffer();
		const transcriptionInput = {
			audio: [...new Uint8Array(blob)],
		};

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
			{ status: 500 }
		);
	}
};

// OpenAI-compatible TTS handler
// POST /audio/speech
export const speechHandler = async (request, env) => {
	try {
		const body = await request.json();

		// OpenAI-compatible parameters
		const {
			model = '@cf/myshell-ai/melotts',
			input,
			voice = 'alloy',
			response_format = 'mp3',
			speed = 1.0,
		} = body;

		if (!input) {
			return Response.json(
				{
					error: {
						message: 'No input text provided',
						type: 'invalid_request_error',
					},
				},
				{ status: 400 }
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
				{ status: 400 }
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

		const response = await env.AI.run(modelPath, aiInput);

		// MeloTTS returns either:
		// 1. JSON with base64-encoded audio: { audio: "base64string" }
		// 2. Direct binary MP3 data

		let audioData;
		let isBase64 = false;

		// Check if response is JSON with base64 audio
		if (response && typeof response === 'object' && response.audio) {
			// Base64 encoded audio
			audioData = Uint8Array.from(atob(response.audio), c => c.charCodeAt(0));
			isBase64 = true;
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

		// Return audio as blob
		return new Response(audioData, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `attachment; filename="${filename}"`,
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
			{ status: 500 }
		);
	}
};

// Models endpoint - OpenAI compatible
export const modelsHandler = async (request, env) => {
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
