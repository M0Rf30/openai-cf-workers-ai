import { describe, it, expect, vi, beforeEach } from 'vitest';
import { modelsHandler } from '../../routes/models';

const createMockEnv = () => ({
	AI: {
		run: vi.fn(),
	},
	ACCESS_TOKEN: 'test-token',
});

const createMockRequest = () => ({
	method: 'GET',
	headers: new Map(),
});

describe('Models Handler', () => {
	let mockEnv;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.clearAllMocks();
	});

	it('should return list of available models', async () => {
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.object).toBe('list');
		expect(result.data).toBeInstanceOf(Array);
		expect(result.data.length).toBeGreaterThan(0);
	});

	it('should include STT models', async () => {
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		const result = await response.json();

		const sttModels = result.data.filter(model => 
			model.capabilities && model.capabilities.includes('transcription')
		);

		expect(sttModels.length).toBeGreaterThan(0);
		expect(sttModels[0]).toMatchObject({
			object: 'model',
			owned_by: 'cloudflare',
			capabilities: expect.arrayContaining(['transcription']),
		});
	});

	it('should include TTS models', async () => {
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		const result = await response.json();

		const ttsModels = result.data.filter(model => 
			model.capabilities && model.capabilities.includes('text-to-speech')
		);

		expect(ttsModels.length).toBeGreaterThan(0);
		expect(ttsModels[0]).toMatchObject({
			object: 'model',
			owned_by: 'cloudflare',
			capabilities: expect.arrayContaining(['text-to-speech']),
		});
	});

	it('should include chat models', async () => {
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		const result = await response.json();

		const chatModels = result.data.filter(model => 
			model.capabilities && model.capabilities.includes('chat')
		);

		expect(chatModels.length).toBeGreaterThan(0);
	});

	it('should include embedding models', async () => {
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		const result = await response.json();

		const embeddingModels = result.data.filter(model => 
			model.capabilities && model.capabilities.includes('embeddings')
		);

		expect(embeddingModels.length).toBeGreaterThan(0);
	});

	it('should have proper model structure', async () => {
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		const result = await response.json();

		const model = result.data[0];
		expect(model).toMatchObject({
			id: expect.any(String),
			object: 'model',
			created: expect.any(Number),
			owned_by: expect.any(String),
		});
	});

	it('should not require authentication for models endpoint', async () => {
		// The models endpoint is typically public in OpenAI API
		const mockRequest = createMockRequest();

		const response = await modelsHandler(mockRequest, mockEnv);
		
		expect(response.status).toBe(200);
	});
});