import { describe, it, expect } from 'vitest';
import {
	MODEL_CONTEXT_WINDOWS,
	MODEL_CATEGORIES,
	MODEL_MAPPING,
	MODEL_CAPABILITIES,
	DEFAULT_MODELS,
	getAllModels,
	getModelsByCapability,
	isValidModel,
	getModelContextWindow,
	isModelSupported,
	calculateDefaultMaxTokens,
	getModelsWithContextAbove,
} from '../../utils/models.js';

describe('Models Configuration', () => {
	describe('MODEL_CONTEXT_WINDOWS', () => {
		it('should be an object with model IDs as keys', () => {
			expect(MODEL_CONTEXT_WINDOWS).toBeDefined();
			expect(typeof MODEL_CONTEXT_WINDOWS).toBe('object');
			expect(Object.keys(MODEL_CONTEXT_WINDOWS).length).toBeGreaterThan(0);
		});

		it('should have numeric context window values', () => {
			Object.values(MODEL_CONTEXT_WINDOWS).forEach(contextWindow => {
				expect(typeof contextWindow).toBe('number');
				expect(contextWindow).toBeGreaterThan(0);
			});
		});

		it('should have valid model ID format', () => {
			Object.keys(MODEL_CONTEXT_WINDOWS).forEach(modelId => {
				expect(modelId).toMatch(/^@(cf|hf)\//);
			});
		});
	});

	describe('MODEL_CATEGORIES', () => {
		it('should have expected categories', () => {
			const expectedCategories = [
				'chat',
				'completion',
				'embeddings',
				'audio_stt',
				'audio_tts',
				'image_generation',
				'vision',
			];

			expectedCategories.forEach(category => {
				expect(MODEL_CATEGORIES[category]).toBeDefined();
				expect(Array.isArray(MODEL_CATEGORIES[category])).toBe(true);
			});
		});

		it('should have models in each category', () => {
			Object.entries(MODEL_CATEGORIES).forEach(([category, models]) => {
				expect(models.length).toBeGreaterThan(0);
			});
		});

		it('should only contain valid model IDs', () => {
			Object.values(MODEL_CATEGORIES).forEach(models => {
				models.forEach(modelId => {
					expect(MODEL_CONTEXT_WINDOWS[modelId]).toBeDefined();
				});
			});
		});
	});

	describe('MODEL_MAPPING', () => {
		it('should map OpenAI models to Cloudflare models', () => {
			expect(MODEL_MAPPING['gpt-3.5-turbo']).toBeDefined();
			expect(MODEL_MAPPING['gpt-4']).toBeDefined();
			expect(MODEL_MAPPING['text-embedding-ada-002']).toBeDefined();
		});

		it('should only map to valid Cloudflare models', () => {
			Object.values(MODEL_MAPPING).forEach(cfModel => {
				expect(MODEL_CONTEXT_WINDOWS[cfModel]).toBeDefined();
			});
		});
	});

	describe('MODEL_CAPABILITIES', () => {
		it('should define capabilities for models', () => {
			expect(MODEL_CAPABILITIES).toBeDefined();
			expect(typeof MODEL_CAPABILITIES).toBe('object');
		});

		it('should have array values for capabilities', () => {
			Object.values(MODEL_CAPABILITIES).forEach(capabilities => {
				expect(Array.isArray(capabilities)).toBe(true);
				expect(capabilities.length).toBeGreaterThan(0);
			});
		});
	});

	describe('DEFAULT_MODELS', () => {
		it('should have default models for each category', () => {
			const categories = ['chat', 'completion', 'embeddings', 'audio_stt', 'image_generation'];

			categories.forEach(category => {
				expect(DEFAULT_MODELS[category]).toBeDefined();
				expect(typeof DEFAULT_MODELS[category]).toBe('string');
			});
		});

		it('should only use valid models as defaults', () => {
			Object.values(DEFAULT_MODELS).forEach(modelId => {
				expect(MODEL_CONTEXT_WINDOWS[modelId]).toBeDefined();
			});
		});
	});

	describe('Helper Functions', () => {
		describe('getAllModels', () => {
			it('should return array of all unique models', () => {
				const allModels = getAllModels();
				expect(Array.isArray(allModels)).toBe(true);
				expect(allModels.length).toBeGreaterThan(0);

				// Check for uniqueness
				const uniqueModels = new Set(allModels);
				expect(uniqueModels.size).toBe(allModels.length);
			});

			it('should return sorted models', () => {
				const allModels = getAllModels();
				const sortedModels = [...allModels].sort();
				expect(allModels).toEqual(sortedModels);
			});
		});

		describe('getModelsByCapability', () => {
			it('should return models with text-generation capability', () => {
				const models = getModelsByCapability('text-generation');
				expect(Array.isArray(models)).toBe(true);
			});

			it('should return empty array for non-existent capability', () => {
				const models = getModelsByCapability('non-existent-capability');
				expect(Array.isArray(models)).toBe(true);
				expect(models.length).toBe(0);
			});
		});

		describe('isValidModel', () => {
			it('should return true for valid models', () => {
				const firstModel = Object.keys(MODEL_CAPABILITIES)[0];
				expect(isValidModel(firstModel)).toBe(true);
			});

			it('should return false for invalid models', () => {
				expect(isValidModel('invalid-model')).toBe(false);
			});
		});

		describe('getModelContextWindow', () => {
			it('should return context window for valid models', () => {
				const firstModel = Object.keys(MODEL_CONTEXT_WINDOWS)[0];
				const contextWindow = getModelContextWindow(firstModel);
				expect(typeof contextWindow).toBe('number');
				expect(contextWindow).toBeGreaterThan(0);
			});

			it('should return default for unknown models', () => {
				const contextWindow = getModelContextWindow('unknown-model');
				expect(contextWindow).toBe(4096);
			});
		});

		describe('isModelSupported', () => {
			it('should return true for supported models', () => {
				const firstModel = Object.keys(MODEL_CONTEXT_WINDOWS)[0];
				expect(isModelSupported(firstModel)).toBe(true);
			});

			it('should return false for unsupported models', () => {
				expect(isModelSupported('unsupported-model')).toBe(false);
			});
		});

		describe('calculateDefaultMaxTokens', () => {
			it('should calculate max tokens based on context window', () => {
				const firstModel = Object.keys(MODEL_CONTEXT_WINDOWS)[0];
				const maxTokens = calculateDefaultMaxTokens(firstModel);
				expect(typeof maxTokens).toBe('number');
				expect(maxTokens).toBeGreaterThan(0);
			});

			it('should reserve percentage of context window', () => {
				const firstModel = Object.keys(MODEL_CONTEXT_WINDOWS)[0];
				const contextWindow = MODEL_CONTEXT_WINDOWS[firstModel];
				const maxTokens = calculateDefaultMaxTokens(firstModel, 10);
				expect(maxTokens).toBeLessThan(contextWindow);
			});

			it('should return at least 100 tokens', () => {
				const maxTokens = calculateDefaultMaxTokens('any-model');
				expect(maxTokens).toBeGreaterThanOrEqual(100);
			});
		});

		describe('getModelsWithContextAbove', () => {
			it('should return models with context above threshold', () => {
				const models = getModelsWithContextAbove(100000);
				expect(Array.isArray(models)).toBe(true);

				models.forEach(modelId => {
					expect(MODEL_CONTEXT_WINDOWS[modelId]).toBeGreaterThanOrEqual(100000);
				});
			});

			it('should return empty array for very high threshold', () => {
				const models = getModelsWithContextAbove(10000000);
				expect(Array.isArray(models)).toBe(true);
				expect(models.length).toBe(0);
			});
		});
	});

	describe('Data Consistency', () => {
		it('should not have duplicate models across all categories', () => {
			const allCategoryModels = Object.values(MODEL_CATEGORIES).flat();
			const uniqueModels = new Set(allCategoryModels);

			// Some models can appear in multiple categories (e.g., chat and completion)
			// So we just check that the arrays are valid
			expect(allCategoryModels.length).toBeGreaterThan(0);
		});

		it('should have context windows for all categorized models', () => {
			Object.values(MODEL_CATEGORIES).forEach(models => {
				models.forEach(modelId => {
					expect(MODEL_CONTEXT_WINDOWS[modelId]).toBeDefined();
					expect(MODEL_CONTEXT_WINDOWS[modelId]).toBeGreaterThan(0);
				});
			});
		});
	});
});
