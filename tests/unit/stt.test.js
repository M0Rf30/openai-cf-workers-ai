import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transcriptionHandler } from '../../routes/audio.js';

const createMockEnv = () => ({
	AI: {
		run: vi.fn(),
	},
});

describe('STT Transcription Handler', () => {
	let mockEnv;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.clearAllMocks();
	});

	it('should transcribe audio correctly', async () => {
		const mockAudioBlob = new Blob(['mock audio data'], { type: 'audio/wav' });
		const mockFormData = new FormData();
		mockFormData.append('file', mockAudioBlob, 'test.wav');

		const mockRequest = {
			formData: () => Promise.resolve(mockFormData),
			headers: new Map([['Content-Type', 'multipart/form-data']]),
		};

		mockEnv.AI.run.mockResolvedValue({
			text: 'Hello, this is a test of text to speech.',
		});

		const response = await transcriptionHandler(mockRequest, mockEnv);
		const jsonResponse = await response.json();

		expect(response.status).toBe(200);
		expect(jsonResponse.text).toBe('Hello, this is a test of text to speech.');
		expect(mockEnv.AI.run).toHaveBeenCalledTimes(1);
		expect(mockEnv.AI.run).toHaveBeenCalledWith('@cf/openai/whisper', {
			audio: expect.any(Array),
		});
	});
});
