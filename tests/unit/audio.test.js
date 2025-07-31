import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcriptionHandler, translationHandler, speechHandler } from '../../routes/audio';

// Mock environment
const createMockEnv = () => ({
	AI: {
		run: vi.fn(),
	},
	ACCESS_TOKEN: 'test-token',
});

// Mock file helper
const createMockFile = (name = 'test.wav', size = 1024) => {
	const buffer = new ArrayBuffer(size);
	return {
		name,
		size,
		arrayBuffer: () => Promise.resolve(buffer),
	};
};

// Mock FormData helper
const createMockFormData = (data = {}) => {
	const formData = new Map();
	Object.entries(data).forEach(([key, value]) => {
		formData.set(key, value);
	});
	formData.get = (key) => formData.get(key);
	return formData;
};

// Mock Request helper
const createMockRequest = (headers = {}, formData = null, json = null) => ({
	headers: new Map(Object.entries(headers)),
	formData: formData ? () => Promise.resolve(formData) : null,
	json: json ? () => Promise.resolve(json) : null,
	method: 'POST',
});

describe('Audio Routes', () => {
	let mockEnv;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.clearAllMocks();
	});

	describe('transcriptionHandler', () => {
		it('should transcribe audio successfully', async () => {
			const mockFile = createMockFile('speech.wav');
			const mockFormData = createMockFormData({
				file: mockFile,
				model: 'whisper-large-v3-turbo',
				response_format: 'json',
			});

			const mockRequest = createMockRequest(
				{ 'Content-Type': 'multipart/form-data' },
				mockFormData
			);

			mockEnv.AI.run.mockResolvedValue({
				text: 'Hello, world!',
			});

			const response = await transcriptionHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.text).toBe('Hello, world!');
			expect(mockEnv.AI.run).toHaveBeenCalledWith(
				'@cf/openai/whisper-large-v3-turbo',
				expect.objectContaining({
					audio: expect.any(String), // Base64 string
				})
			);
		});

		it('should handle missing file error', async () => {
			const mockFormData = createMockFormData({
				model: 'whisper-1',
			});

			const mockRequest = createMockRequest(
				{ 'Content-Type': 'multipart/form-data' },
				mockFormData
			);

			const response = await transcriptionHandler(mockRequest, mockEnv);
			
			expect(response.status).toBe(400);
		});

		it('should handle invalid content type', async () => {
			const mockRequest = createMockRequest({
				'Content-Type': 'application/json',
			});

			const response = await transcriptionHandler(mockRequest, mockEnv);
			
			expect(response.status).toBe(400);
		});

		it('should handle different response formats', async () => {
			const mockFile = createMockFile('speech.wav');
			const mockFormData = createMockFormData({
				file: mockFile,
				model: 'whisper-1',
				response_format: 'text',
			});

			const mockRequest = createMockRequest(
				{ 'Content-Type': 'multipart/form-data' },
				mockFormData
			);

			mockEnv.AI.run.mockResolvedValue({
				text: 'Hello, world!',
			});

			const response = await transcriptionHandler(mockRequest, mockEnv);
			const text = await response.text();

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('text/plain');
			expect(text).toBe('Hello, world!');
		});

		it('should handle verbose_json response format', async () => {
			const mockFile = createMockFile('speech.wav');
			const mockFormData = createMockFormData({
				file: mockFile,
				model: 'whisper-large-v3-turbo',
				response_format: 'verbose_json',
			});

			const mockRequest = createMockRequest(
				{ 'Content-Type': 'multipart/form-data' },
				mockFormData
			);

			mockEnv.AI.run.mockResolvedValue({
				text: 'Hello, world!',
				transcription_info: {
					language: 'en',
					duration: 2.5,
				},
				segments: [
					{
						id: 0,
						start: 0.0,
						end: 2.5,
						text: 'Hello, world!',
						words: [
							{ word: 'Hello,', start: 0.0, end: 0.5 },
							{ word: 'world!', start: 0.6, end: 2.5 },
						],
					},
				],
			});

			const response = await transcriptionHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result).toMatchObject({
				task: 'transcribe',
				language: 'en',
				duration: 2.5,
				text: 'Hello, world!',
				words: expect.any(Array),
				segments: expect.any(Array),
			});
		});
	});

	describe('translationHandler', () => {
		it('should translate audio successfully', async () => {
			const mockFile = createMockFile('speech.wav');
			const mockFormData = createMockFormData({
				file: mockFile,
				model: 'whisper-1',
			});

			const mockRequest = createMockRequest(
				{ 'Content-Type': 'multipart/form-data' },
				mockFormData
			);

			// Mock transcription response
			mockEnv.AI.run
				.mockResolvedValueOnce({
					text: 'Hola mundo',
				})
				// Mock language detection
				.mockResolvedValueOnce({
					response: 'spanish',
				})
				// Mock translation
				.mockResolvedValueOnce({
					translated_text: 'Hello world',
				});

			const response = await translationHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.text).toBe('Hello world');
			expect(result.language).toBe('spanish');
			expect(mockEnv.AI.run).toHaveBeenCalledTimes(3);
		});

		it('should skip translation for English text', async () => {
			const mockFile = createMockFile('speech.wav');
			const mockFormData = createMockFormData({
				file: mockFile,
				model: 'whisper-1',
			});

			const mockRequest = createMockRequest(
				{ 'Content-Type': 'multipart/form-data' },
				mockFormData
			);

			mockEnv.AI.run
				.mockResolvedValueOnce({
					text: 'Hello world',
				})
				.mockResolvedValueOnce({
					response: 'english',
				});

			const response = await translationHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.text).toBe('Hello world');
			expect(result.language).toBe('english');
			expect(mockEnv.AI.run).toHaveBeenCalledTimes(2); // No translation call
		});
	});

	describe('speechHandler', () => {
		it('should generate speech successfully', async () => {
			const mockRequest = createMockRequest(
				{ 'Content-Type': 'application/json' },
				null,
				{
					model: 'tts-1',
					input: 'Hello, world!',
					voice: 'alloy',
				}
			);

			const mockAudioData = new Uint8Array([1, 2, 3, 4]);
			mockEnv.AI.run.mockResolvedValue({
				audio: btoa(String.fromCharCode(...mockAudioData)),
			});

			const response = await speechHandler(mockRequest, mockEnv);

			expect(response.status).toBe(200);
			expect(response.headers.get('Content-Type')).toBe('audio/mpeg');
			expect(mockEnv.AI.run).toHaveBeenCalledWith(
				'@cf/myshell-ai/melotts',
				expect.objectContaining({
					prompt: 'Hello, world!',
					lang: 'it', // alloy maps to Italian
				})
			);
		});

		it('should handle missing input error', async () => {
			const mockRequest = createMockRequest(
				{ 'Content-Type': 'application/json' },
				null,
				{
					model: 'tts-1',
					voice: 'alloy',
				}
			);

			const response = await speechHandler(mockRequest, mockEnv);
			
			expect(response.status).toBe(400);
		});

		it('should handle invalid voice error', async () => {
			const mockRequest = createMockRequest(
				{ 'Content-Type': 'application/json' },
				null,
				{
					model: 'tts-1',
					input: 'Hello, world!',
					voice: 'invalid-voice',
				}
			);

			const response = await speechHandler(mockRequest, mockEnv);
			
			expect(response.status).toBe(400);
		});

		it('should handle different voice mappings', async () => {
			const voices = [
				{ voice: 'alloy', lang: 'it' },
				{ voice: 'echo', lang: 'fr' },
				{ voice: 'fable', lang: 'en' },
			];

			for (const { voice, lang } of voices) {
				const mockRequest = createMockRequest(
					{ 'Content-Type': 'application/json' },
					null,
					{
						model: 'tts-1',
						input: 'Hello, world!',
						voice,
					}
				);

				mockEnv.AI.run.mockResolvedValue({
					audio: btoa('mock-audio-data'),
				});

				await speechHandler(mockRequest, mockEnv);

				expect(mockEnv.AI.run).toHaveBeenLastCalledWith(
					'@cf/myshell-ai/melotts',
					expect.objectContaining({
						lang,
					})
				);
			}
		});
	});
});