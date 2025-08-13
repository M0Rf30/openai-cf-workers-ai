import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chatHandler } from '../../routes/chat';

const createMockEnv = () => ({
	AI: {
		run: vi.fn(),
	},
	ACCESS_TOKEN: 'test-token',
});

const createMockRequest = (body) => ({
	json: () => Promise.resolve(body),
	headers: new Map([['Content-Type', 'application/json']]),
});

describe('Multimodal Chat Handler', () => {
	let mockEnv;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.clearAllMocks();
	});

	it('should handle text-only messages', async () => {
		const mockRequest = createMockRequest({
			model: '@cf/meta/llama-4-scout-17b-16e-instruct',
			messages: [
				{ role: 'user', content: 'Hello!' },
			],
		});

		mockEnv.AI.run.mockResolvedValue({
			response: 'Hello! How can I help you today?',
		});

		const response = await chatHandler(mockRequest, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.choices).toHaveLength(1);
		expect(result.choices[0].message.content).toBe('Hello! How can I help you today?');
		expect(result.choices[0].message.role).toBe('assistant');
	});

	it('should handle multimodal messages with text and image', async () => {
		const mockRequest = createMockRequest({
			model: '@cf/meta/llama-4-scout-17b-16e-instruct',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'What is in this image?' },
						{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,/9j/...' } },
					],
				},
			],
		});

		mockEnv.AI.run.mockResolvedValue({
			response: 'This is a sample image description.',
		});

		const response = await chatHandler(mockRequest, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.choices).toHaveLength(1);
		expect(result.choices[0].message.content).toBe('This is a sample image description.');
		expect(result.choices[0].message.role).toBe('assistant');
	});

	it('should handle single image_url content object', async () => {
		const mockRequest = createMockRequest({
			model: '@cf/meta/llama-4-scout-17b-16e-instruct',
			messages: [
				{
					role: 'user',
					content: {
						type: 'image_url',
						image_url: { url: 'data:image/jpeg;base64,/9j/...' },
					},
				},
			],
		});

		mockEnv.AI.run.mockResolvedValue({
			response: 'I see an image.',
		});

		const response = await chatHandler(mockRequest, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.choices).toHaveLength(1);
		expect(result.choices[0].message.content).toBe('I see an image.');
		expect(result.choices[0].message.role).toBe('assistant');
	});

	it('should reject invalid image URLs', async () => {
		const mockRequest = createMockRequest({
			model: '@cf/meta/llama-4-scout-17b-16e-instruct',
			messages: [
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'What is in this image?' },
						{ type: 'image_url', image_url: { url: 'https://example.com/image.jpg' } },
					],
				},
			],
		});

		const response = await chatHandler(mockRequest, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(400);
		expect(result.error).toBeDefined();
		expect(result.error.message).toContain('Image URL must be a data URI');
	});

	it('should handle mixed content types in messages', async () => {
		const mockRequest = createMockRequest({
			model: '@cf/meta/llama-4-scout-17b-16e-instruct',
			messages: [
				{ role: 'system', content: 'You are a helpful assistant.' },
				{
					role: 'user',
					content: [
						{ type: 'text', text: 'What is in this image?' },
						{ type: 'image_url', image_url: { url: 'data:image/jpeg;base64,/9j/...' } },
					],
				},
				{ role: 'assistant', content: 'I see an image.' },
				{ role: 'user', content: 'Can you describe it in more detail?' },
			],
		});

		mockEnv.AI.run.mockResolvedValue({
			response: 'The image shows...',
		});

		const response = await chatHandler(mockRequest, mockEnv);
		const result = await response.json();

		expect(response.status).toBe(200);
		expect(result.choices).toHaveLength(1);
		expect(result.choices[0].message.content).toBe('The image shows...');
		expect(result.choices[0].message.role).toBe('assistant');
	});
});
