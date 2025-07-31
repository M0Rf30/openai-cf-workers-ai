import { describe, it, expect, vi } from 'vitest';
import { transcriptionHandler } from '../../routes/audio.js';

describe('STT Transcription Handler', () => {
  it('should transcribe audio correctly', async () => {
    // Mock the File object
    const mockFile = new File([new Blob(['mock audio data'], { type: 'audio/wav' })], 'speech.wav', { type: 'audio/wav' });

    // Mock FormData
    const mockFormData = new FormData();
    mockFormData.append('file', mockFile);
    mockFormData.append('model', '@cf/openai/whisper'); // Or any other valid STT model

    // Mock the Request object
    const mockRequest = {
      headers: new Headers({ 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary' }),
      formData: () => Promise.resolve(mockFormData),
    };

    // Mock the env object and AI.run method
    const mockEnv = {
      AI: {
        run: vi.fn((model, input) => {
          // Assert that the correct model is used and input is FormData
          expect(model).toBeTypeOf('string');
          expect(input).toEqual({ audio: expect.any(Array) });
          // Return a mock response from Cloudflare AI
          return Promise.resolve({ text: 'Hello, this is a test of text to speech functionality.' });
        }),
      },
    };

    const response = await transcriptionHandler(mockRequest, mockEnv);
    const jsonResponse = await response.json();

    expect(response.status).toBe(200);
    expect(jsonResponse.text).toBe('Hello, this is a test of text to speech functionality.');
    expect(mockEnv.AI.run).toHaveBeenCalledTimes(1);
  });
});
