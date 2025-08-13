// Unified models configuration for Cloudflare Workers AI
// This file contains all supported models organized by category

export const MODEL_CATEGORIES = {
	chat: [
		'@cf/qwen/qwen1.5-0.5b-chat',
		'@cf/meta/llama-3-8b-instruct',
		'@cf/meta/llama-3.2-3b-instruct',
		'@cf/meta/llama-guard-3-8b',
		'@cf/meta/llama-2-7b-chat-fp16',
		'@cf/mistral/mistral-7b-instruct-v0.1',
		'@cf/mistral/mistral-7b-instruct-v0.2-lora',
		'@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
		'@cf/fblgit/una-cybertron-7b-v2-bf16',
		'@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
		'@cf/meta/llama-2-7b-chat-int8',
		'@cf/meta/llama-3.1-8b-instruct-fp8',
		'@cf/qwen/qwen1.5-7b-chat-awq',
		'@cf/meta/llama-3.2-1b-instruct',
		'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
		'@cf/mistralai/mistral-small-3.1-24b-instruct',
		'@cf/meta/llama-3.1-8b-instruct-awq',
		'@cf/google/gemma-7b-it-lora',
		'@cf/qwen/qwen1.5-1.8b-chat',
		'@cf/meta/llama-3-8b-instruct-awq',
		'@cf/meta/llama-3.2-11b-vision-instruct',
		'@cf/microsoft/phi-2',
		'@cf/qwen/qwen1.5-14b-chat-awq',
		'@cf/openchat/openchat-3.5-0106',
		'@cf/meta/llama-4-scout-17b-16e-instruct',
		'@cf/google/gemma-3-12b-it',
		'@cf/qwen/qwq-32b',
		'@cf/qwen/qwen2.5-coder-32b-instruct',
		'@cf/deepseek-ai/deepseek-math-7b-instruct',
		'@cf/tiiuae/falcon-7b-instruct',
		'@cf/thebloke/discolm-german-7b-v1-awq',
		'@cf/meta-llama/llama-2-7b-chat-hf-lora',
		'@cf/unum/uform-gen2-qwen-500m',
		'@cf/defog/sqlcoder-7b-2',
		'@cf/openai/gpt-oss-120b',
		'@cf/openai/gpt-oss-20b',
		// Missing HuggingFace models added
		'@hf/nexusflow/starling-lm-7b-beta',
		'@hf/thebloke/llamaguard-7b-awq',
		'@hf/thebloke/neural-chat-7b-v3-1-awq',
		'@hf/mistral/mistral-7b-instruct-v0.2',
		'@hf/thebloke/mistral-7b-instruct-v0.1-awq',
		'@hf/thebloke/llama-2-13b-chat-awq',
		'@hf/thebloke/deepseek-coder-6.7b-base-awq',
		'@hf/thebloke/openhermes-2.5-mistral-7b-awq',
		'@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
		'@hf/nousresearch/hermes-2-pro-mistral-7b',
		'@hf/thebloke/zephyr-7b-beta-awq',
		'@hf/meta-llama/meta-llama-3-8b-instruct',
		'@hf/google/gemma-7b-it',
		// Missing Cloudflare models added
		'@cf/google/gemma-2b-it-lora',
		'@cf/facebook/bart-large-cnn',
	],

	completion: [
		'@cf/qwen/qwen1.5-0.5b-chat',
		'@cf/meta/llama-3-8b-instruct',
		'@cf/meta/llama-3.2-3b-instruct',
		'@cf/meta/llama-guard-3-8b',
		'@cf/meta/llama-2-7b-chat-fp16',
		'@cf/mistral/mistral-7b-instruct-v0.1',
		'@cf/mistral/mistral-7b-instruct-v0.2-lora',
		'@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
		'@cf/fblgit/una-cybertron-7b-v2-bf16',
		'@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
		'@cf/meta/llama-2-7b-chat-int8',
		'@cf/meta/llama-3.1-8b-instruct-fp8',
		'@cf/qwen/qwen1.5-7b-chat-awq',
		'@cf/meta/llama-3.2-1b-instruct',
		'@cf/meta/llama-3.3-70b-instruct-fp8-fast',
		'@cf/mistralai/mistral-small-3.1-24b-instruct',
		'@cf/meta/llama-3.1-8b-instruct-awq',
		'@cf/google/gemma-7b-it-lora',
		'@cf/qwen/qwen1.5-1.8b-chat',
		'@cf/meta/llama-3-8b-instruct-awq',
		'@cf/meta/llama-3.2-11b-vision-instruct',
		'@cf/microsoft/phi-2',
		'@cf/qwen/qwen1.5-14b-chat-awq',
		'@cf/openchat/openchat-3.5-0106',
		'@cf/meta/llama-4-scout-17b-16e-instruct',
		'@cf/google/gemma-3-12b-it',
		'@cf/qwen/qwq-32b',
		'@cf/qwen/qwen2.5-coder-32b-instruct',
		'@cf/deepseek-ai/deepseek-math-7b-instruct',
		'@cf/tiiuae/falcon-7b-instruct',
		'@cf/thebloke/discolm-german-7b-v1-awq',
		'@cf/meta-llama/llama-2-7b-chat-hf-lora',
		'@cf/unum/uform-gen2-qwen-500m',
		'@cf/defog/sqlcoder-7b-2',
		'@cf/openai/gpt-oss-120b',
		'@cf/openai/gpt-oss-20b',
		// Missing HuggingFace models added
		'@hf/nexusflow/starling-lm-7b-beta',
		'@hf/thebloke/llamaguard-7b-awq',
		'@hf/thebloke/neural-chat-7b-v3-1-awq',
		'@hf/mistral/mistral-7b-instruct-v0.2',
		'@hf/thebloke/mistral-7b-instruct-v0.1-awq',
		'@hf/thebloke/llama-2-13b-chat-awq',
		'@hf/thebloke/deepseek-coder-6.7b-base-awq',
		'@hf/thebloke/openhermes-2.5-mistral-7b-awq',
		'@hf/thebloke/deepseek-coder-6.7b-instruct-awq',
		'@hf/nousresearch/hermes-2-pro-mistral-7b',
		'@hf/thebloke/zephyr-7b-beta-awq',
		'@hf/meta-llama/meta-llama-3-8b-instruct',
		'@hf/google/gemma-7b-it',
		// Missing Cloudflare models added
		'@cf/google/gemma-2b-it-lora',
		'@cf/facebook/bart-large-cnn',
	],

	embeddings: [
		'@cf/baai/bge-base-en-v1.5',
		'@cf/baai/bge-small-en-v1.5',
		'@cf/baai/bge-large-en-v1.5',
		'@cf/baai/bge-reranker-base',
		'@cf/baai/bge-m3',
	],

	audio_stt: [
		'@cf/openai/whisper',
		'@cf/openai/whisper-tiny-en',
		'@cf/openai/whisper-large-v3-turbo',
	],

	audio_tts: ['@cf/myshell-ai/melotts'],

	audio_translation: ['@cf/meta/m2m100-1.2b'],

	audio_language_detection: ['@cf/meta/llama-2-7b-chat-int8'],

	image_generation: [
		'@cf/black-forest-labs/flux-1-schnell',
		'@cf/bytedance/stable-diffusion-xl-lightning',
		'@cf/runwayml/stable-diffusion-v1-5-img2img',
		'@cf/runwayml/stable-diffusion-v1-5-inpainting',
		'@cf/stabilityai/stable-diffusion-xl-base-1.0',
		'@cf/lykon/dreamshaper-8-lcm',
	],

	vision: [
		'@cf/meta/llama-3.2-11b-vision-instruct',
		'@cf/llava-hf/llava-1.5-7b-hf',
		'@cf/unum/uform-gen2-qwen-500m',
	],

	classification: ['@cf/huggingface/distilbert-sst-2-int8', '@cf/microsoft/resnet-50'],

	reranking: ['@cf/baai/bge-reranker-base'],

	rag: [
		'@cf/baai/bge-base-en-v1.5',
		'@cf/baai/bge-small-en-v1.5',
		'@cf/baai/bge-large-en-v1.5',
		'@cf/baai/bge-reranker-base',
		'@cf/baai/bge-m3',
	],
};

// OpenAI-compatible model name mappings - using most powerful available models
export const MODEL_MAPPING = {
	// Chat models - prioritizing latest and most capable
	'gpt-3.5-turbo': '@cf/meta/llama-3.1-8b-instruct-fp8', // Good balance of speed/capability
	'gpt-4': '@cf/meta/llama-3.3-70b-instruct-fp8-fast', // Most powerful general model
	'gpt-4o': '@cf/meta/llama-3.2-11b-vision-instruct', // Best multimodal model
	'gpt-4-turbo': '@cf/meta/llama-3.3-70b-instruct-fp8-fast', // Most powerful for complex tasks
	'gpt-3.5-turbo-16k': '@cf/qwen/qwq-32b', // Good reasoning model for longer contexts
	'gpt-4-32k': '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b', // Best reasoning model available
	'gpt-4o-mini': '@cf/meta/llama-3.2-3b-instruct', // Efficient small model
	'gpt-3.5-turbo-instruct': '@cf/qwen/qwen2.5-coder-32b-instruct', // Best coding model

	// Embedding models - using largest available
	'text-embedding-ada-002': '@cf/baai/bge-base-en-v1.5', // Good balance
	'text-embedding-3-small': '@cf/baai/bge-small-en-v1.5', // Small but efficient
	'text-embedding-3-large': '@cf/baai/bge-large-en-v1.5', // Most capable embedding model

	// Audio models - using latest versions
	'whisper-1': '@cf/openai/whisper-large-v3-turbo', // Most accurate available
	'whisper': '@cf/openai/whisper-large-v3-turbo', // Most accurate available
	'whisper-tiny-en': '@cf/openai/whisper-tiny-en', // Keep original for speed
	'whisper-large-v3-turbo': '@cf/openai/whisper-large-v3-turbo', // Direct mapping
	'tts-1': '@cf/myshell-ai/melotts',
	'tts-1-hd': '@cf/myshell-ai/melotts',

	// Image models - using most modern
	'dall-e-2': '@cf/black-forest-labs/flux-1-schnell', // Most modern image gen
	'dall-e-3': '@cf/black-forest-labs/flux-1-schnell', // Most modern image gen

	// Vision models - using latest
	'gpt-4-vision-preview': '@cf/meta/llama-3.2-11b-vision-instruct', // Latest vision model

	// Classification models - using most capable
	'text-moderation-latest': '@cf/meta/llama-guard-3-8b', // Latest guard model
	'text-moderation-stable': '@cf/meta/llama-guard-3-8b', // Latest guard model

	// Code models - using most capable
	'code-davinci-002': '@cf/qwen/qwen2.5-coder-32b-instruct', // Best coding model

	// Reranking models
	'rerank-001': '@cf/baai/bge-reranker-base',
};

// Reverse mapping for API responses
export const REVERSE_MODEL_MAPPING = Object.fromEntries(
	Object.entries(MODEL_MAPPING).map(([openai, cf]) => [cf, openai])
);

// Model capabilities
export const MODEL_CAPABILITIES = {
	// Chat models - Cloudflare
	'@cf/meta/llama-3.1-8b-instruct-fp8': ['text-generation', 'function-calling'],
	'@cf/meta/llama-3.3-70b-instruct-fp8-fast': ['text-generation', 'function-calling'],
	'@cf/qwen/qwen1.5-0.5b-chat': ['text-generation'],
	'@cf/meta/llama-3-8b-instruct': ['text-generation'],
	'@cf/meta/llama-3.2-3b-instruct': ['text-generation'],
	'@cf/meta/llama-guard-3-8b': ['text-generation', 'content-moderation'],
	'@cf/meta/llama-2-7b-chat-fp16': ['text-generation'],
	'@cf/mistral/mistral-7b-instruct-v0.1': ['text-generation'],
	'@cf/mistral/mistral-7b-instruct-v0.2-lora': ['text-generation'],
	'@cf/tinyllama/tinyllama-1.1b-chat-v1.0': ['text-generation'],
	'@cf/fblgit/una-cybertron-7b-v2-bf16': ['text-generation'],
	'@cf/deepseek-ai/deepseek-r1-distill-qwen-32b': ['text-generation', 'reasoning'],
	'@cf/meta/llama-2-7b-chat-int8': ['text-generation', 'language-detection'],
	'@cf/qwen/qwen1.5-7b-chat-awq': ['text-generation'],
	'@cf/meta/llama-3.2-1b-instruct': ['text-generation'],
	'@cf/mistralai/mistral-small-3.1-24b-instruct': ['text-generation'],
	'@cf/meta/llama-3.1-8b-instruct-awq': ['text-generation'],
	'@cf/google/gemma-7b-it-lora': ['text-generation'],
	'@cf/google/gemma-2b-it-lora': ['text-generation'],
	'@cf/qwen/qwen1.5-1.8b-chat': ['text-generation'],
	'@cf/meta/llama-3-8b-instruct-awq': ['text-generation'],
	'@cf/meta/llama-3.2-11b-vision-instruct': ['text-generation', 'vision'],
	'@cf/microsoft/phi-2': ['text-generation'],
	'@cf/qwen/qwen1.5-14b-chat-awq': ['text-generation'],
	'@cf/openchat/openchat-3.5-0106': ['text-generation'],
	'@cf/meta/llama-4-scout-17b-16e-instruct': ['text-generation', 'vision'],
	'@cf/google/gemma-3-12b-it': ['text-generation'],
	'@cf/qwen/qwq-32b': ['text-generation', 'reasoning'],
	'@cf/qwen/qwen2.5-coder-32b-instruct': ['text-generation', 'code-generation'],
	'@cf/deepseek-ai/deepseek-math-7b-instruct': ['text-generation', 'math'],
	'@cf/tiiuae/falcon-7b-instruct': ['text-generation'],
	'@cf/thebloke/discolm-german-7b-v1-awq': ['text-generation', 'german'],
	'@cf/meta-llama/llama-2-7b-chat-hf-lora': ['text-generation'],
	'@cf/unum/uform-gen2-qwen-500m': ['vision'],
	'@cf/defog/sqlcoder-7b-2': ['text-generation', 'sql'],
	'@cf/openai/gpt-oss-120b': ['text-generation'],
	'@cf/openai/gpt-oss-20b': ['text-generation'],
	'@cf/facebook/bart-large-cnn': ['text-generation', 'summarization'],

	// Chat models - HuggingFace
	'@hf/nexusflow/starling-lm-7b-beta': ['text-generation'],
	'@hf/thebloke/llamaguard-7b-awq': ['text-generation', 'content-moderation'],
	'@hf/thebloke/neural-chat-7b-v3-1-awq': ['text-generation'],
	'@hf/mistral/mistral-7b-instruct-v0.2': ['text-generation'],
	'@hf/thebloke/mistral-7b-instruct-v0.1-awq': ['text-generation'],
	'@hf/thebloke/llama-2-13b-chat-awq': ['text-generation'],
	'@hf/thebloke/deepseek-coder-6.7b-base-awq': ['text-generation', 'code-generation'],
	'@hf/thebloke/openhermes-2.5-mistral-7b-awq': ['text-generation'],
	'@hf/thebloke/deepseek-coder-6.7b-instruct-awq': ['text-generation', 'code-generation'],
	'@hf/nousresearch/hermes-2-pro-mistral-7b': ['text-generation'],
	'@hf/thebloke/zephyr-7b-beta-awq': ['text-generation'],
	'@hf/meta-llama/meta-llama-3-8b-instruct': ['text-generation'],
	'@hf/google/gemma-7b-it': ['text-generation'],

	// Embedding models
	'@cf/baai/bge-base-en-v1.5': ['embeddings'],
	'@cf/baai/bge-small-en-v1.5': ['embeddings'],
	'@cf/baai/bge-large-en-v1.5': ['embeddings'],
	'@cf/baai/bge-reranker-base': ['reranking'],
	'@cf/baai/bge-m3': ['embeddings', 'reranking', 'multilingual'],

	// Audio models
	'@cf/openai/whisper': ['speech-to-text'],
	'@cf/openai/whisper-tiny-en': ['speech-to-text'],
	'@cf/openai/whisper-large-v3-turbo': ['speech-to-text'],
	'@cf/myshell-ai/melotts': ['text-to-speech'],
	'@cf/meta/m2m100-1.2b': ['translation'],

	// Image models
	'@cf/black-forest-labs/flux-1-schnell': ['image-generation'],
	'@cf/bytedance/stable-diffusion-xl-lightning': ['image-generation'],
	'@cf/runwayml/stable-diffusion-v1-5-img2img': ['image-generation', 'image-to-image'],
	'@cf/runwayml/stable-diffusion-v1-5-inpainting': ['image-generation', 'inpainting'],
	'@cf/stabilityai/stable-diffusion-xl-base-1.0': ['image-generation'],
	'@cf/lykon/dreamshaper-8-lcm': ['image-generation'],

	// Vision models
	'@cf/llava-hf/llava-1.5-7b-hf': ['vision'],

	// Classification models
	'@cf/huggingface/distilbert-sst-2-int8': ['text-classification', 'sentiment-analysis'],
	'@cf/microsoft/resnet-50': ['image-classification'],
};

// Default models for each category - prioritizing most modern and powerful models
export const DEFAULT_MODELS = {
	chat: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', // Most powerful general chat model
	completion: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', // Same as chat for consistency
	embeddings: '@cf/baai/bge-large-en-v1.5', // Largest and most capable embedding model
	audio_stt: '@cf/openai/whisper-large-v3-turbo', // Latest and most accurate Whisper model
	audio_tts: '@cf/myshell-ai/melotts', // Only TTS option available
	audio_translation: '@cf/meta/m2m100-1.2b', // Only translation option available
	audio_language_detection: '@cf/meta/llama-2-7b-chat-int8', // Only option available
	image_generation: '@cf/black-forest-labs/flux-1-schnell', // Most modern image generation model
	vision: '@cf/meta/llama-3.2-11b-vision-instruct', // Latest multimodal vision model
	classification: '@cf/microsoft/resnet-50', // More modern than DistilBERT for general classification
	reranking: '@cf/baai/bge-reranker-base', // Only reranking option available
	rag: '@cf/baai/bge-large-en-v1.5', // Best embedding model for RAG applications
};

// Helper function to get all models
export const getAllModels = () => {
	const allModels = new Set();
	Object.values(MODEL_CATEGORIES).forEach(category => {
		category.forEach(model => allModels.add(model));
	});
	return Array.from(allModels).sort();
};

// Helper function to get models by capability
export const getModelsByCapability = capability => {
	return Object.entries(MODEL_CAPABILITIES)
		.filter(([model, capabilities]) => capabilities.includes(capability))
		.map(([model]) => model);
};

// Helper function to check if model exists
export const isValidModel = modelName => {
	return Object.keys(MODEL_CAPABILITIES).includes(modelName);
};
