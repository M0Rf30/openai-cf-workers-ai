import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { modelsHandler } from '../../routes/models';

const createMockEnv = () => ({
	CLOUDFLARE_ACCOUNT_ID: 'test-account-id',
	CLOUDFLARE_API_TOKEN: 'test-api-token',
});

describe('Models Handler', () => {
	let mockEnv;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.stubGlobal('fetch', vi.fn());
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	const mockApiResponse = {
		result: [
			{
				name: '@cf/meta/llama-2-7b-chat-fp16',
				source: 1,
			},
			{
				name: '@cf/openai/whisper',
				source: 1,
			},
			{
				name: '@cf/myshell-ai/melotts',
				source: 1,
			},
			{
				name: '@cf/baai/bge-base-en-v1.5',
				source: 1,
			},
		],
	};

	it('should return list of available models', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.object).toBe('list');
		expect(result.data.length).toBe(mockApiResponse.result.length);
	});

	it('should include STT models', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		const result = await response.json();

		const sttModel = result.data.find(model => model.id === '@cf/openai/whisper');
		expect(sttModel).toBeDefined();
	});

	it('should include TTS models', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		const result = await response.json();

		const ttsModel = result.data.find(model => model.id === '@cf/myshell-ai/melotts');
		expect(ttsModel).toBeDefined();
	});

	it('should include chat models', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		const result = await response.json();

		const chatModel = result.data.find(model => model.id === '@cf/meta/llama-2-7b-chat-fp16');
		expect(chatModel).toBeDefined();
	});

	it('should include embedding models', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		const result = await response.json();

		const embeddingModel = result.data.find(model => model.id === '@cf/baai/bge-base-en-v1.5');
		expect(embeddingModel).toBeDefined();
	});

	it('should have proper model structure', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		const result = await response.json();

		const model = result.data[0];
		expect(model).toHaveProperty('id');
		expect(model).toHaveProperty('object', 'model');
		expect(model).toHaveProperty('created');
		expect(model).toHaveProperty('owned_by');
	});

	it('should not require authentication for models endpoint', async () => {
		fetch.mockResolvedValue({
			ok: true,
			json: () => Promise.resolve(mockApiResponse),
		});

		const response = await modelsHandler({}, mockEnv);
		
		expect(response.status).toBe(200);
	});
});