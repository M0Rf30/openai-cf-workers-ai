import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
	storeDocumentHandler as ragDocumentStoreHandler,
	ragSearchHandler,
	ragChatHandler,
} from '../../routes/rag';

// Mock environment
const createMockEnv = () => ({
	AI: {
		run: vi.fn(),
	},
	VECTOR_INDEX: {
		upsert: vi.fn(),
		query: vi.fn(),
	},
	ACCESS_TOKEN: 'test-token',
});

// Mock Request helper
const createMockRequest = (method = 'POST', json = null) => ({
	method,
	json: json ? () => Promise.resolve(json) : null,
	headers: new Map([['Authorization', 'Bearer test-token']]),
});

describe('RAG Routes', () => {
	let mockEnv;

	beforeEach(() => {
		mockEnv = createMockEnv();
		vi.clearAllMocks();
	});

	describe('ragDocumentStoreHandler', () => {
		it('should store document successfully', async () => {
			const mockRequest = createMockRequest('POST', {
				text: 'Test document content',
				metadata: {
					docId: 'test-1',
					title: 'Test Document',
				},
			});

			mockEnv.VECTOR_INDEX.upsert.mockResolvedValue({
				success: true,
				document_id: 'test-1',
			});

			const response = await ragDocumentStoreHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.success).toBe(true);
			expect(result.document_id).toBe('test-1');
		});

		it('should handle missing docId error', async () => {
			const mockRequest = createMockRequest('POST', {
				text: 'Test document content',
				metadata: {
					title: 'Test Document',
				},
			});

			const response = await ragDocumentStoreHandler(mockRequest, mockEnv);

			expect(response.status).toBe(400);
		});
	});

	describe('ragSearchHandler', () => {
		it('should perform search successfully', async () => {
			const mockRequest = createMockRequest('POST', {
				query: 'Test query',
				top_k: 3,
			});

			mockEnv.VECTOR_INDEX.query.mockResolvedValue({
				matches: [
					{
						id: 'doc-1',
						score: 0.95,
						metadata: { title: 'Test Document' },
					},
				],
			});

			const response = await ragSearchHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.query).toBe('Test query');
			expect(result.sources).toBeDefined();
		});

		it('should handle missing query error', async () => {
			const mockRequest = createMockRequest('POST', {
				top_k: 3,
			});

			const response = await ragSearchHandler(mockRequest, mockEnv);

			expect(response.status).toBe(400);
		});
	});

	describe('ragChatHandler', () => {
		it('should handle RAG chat successfully', async () => {
			const mockRequest = createMockRequest('POST', {
				messages: [
					{
						role: 'user',
						content: 'What is RAG?',
					},
				],
				rag_top_k: 2,
			});

			// Mock search response
			mockEnv.VECTOR_INDEX.query.mockResolvedValue({
				matches: [
					{
						id: 'doc-1',
						score: 0.95,
						metadata: { content: 'RAG is Retrieval-Augmented Generation' },
					},
				],
			});

			// Mock AI completion response
			mockEnv.AI.run.mockResolvedValue({
				response: 'RAG stands for Retrieval-Augmented Generation.',
			});

			const response = await ragChatHandler(mockRequest, mockEnv);
			const result = await response.json();

			expect(response.status).toBe(200);
			expect(result.choices).toBeDefined();
			expect(mockEnv.VECTOR_INDEX.query).toHaveBeenCalled();
		});

		it('should handle missing messages error', async () => {
			const mockRequest = createMockRequest('POST', {
				rag_top_k: 2,
			});

			const response = await ragChatHandler(mockRequest, mockEnv);

			expect(response.status).toBe(400);
		});
	});
});
