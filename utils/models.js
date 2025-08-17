// Unified models configuration for Cloudflare Workers AI
// This file contains all supported models organized by category with context windows

// === CONTEXT WINDOW MAPPING ===
export const MODEL_CONTEXT_WINDOWS = {
	// === Meta Llama Models ===
	'@cf/meta/llama-4-scout-17b-16e-instruct': 131072, // Initially supports 131k tokens (expandable to 10M)
	'@cf/meta/llama-3.3-70b-instruct-fp8-fast': 24000, // 24k tokens (corrected based on API error)
	'@cf/meta/llama-3.1-70b-instruct': 128000, // 128k tokens
	'@cf/meta/llama-3.1-8b-instruct': 128000, // 128k tokens
	'@cf/meta/llama-3.1-8b-instruct-fast': 128000, // 128k tokens
	'@cf/meta/llama-3.1-8b-instruct-fp8': 128000, // 128k tokens
	'@cf/meta/llama-3.1-8b-instruct-awq': 128000, // 128k tokens
	'@cf/meta/llama-3-8b-instruct': 8192, // 8k tokens (original Llama 3)
	'@cf/meta/llama-3-8b-instruct-awq': 8192, // 8k tokens
	'@cf/meta/llama-3.2-1b-instruct': 60000, // 60k tokens
	'@cf/meta/llama-3.2-3b-instruct': 128000, // 128k tokens
	'@cf/meta/llama-3.2-11b-vision-instruct': 128000, // 128k tokens
	'@cf/meta/llama-guard-3-8b': 8192, // Based on Llama 3.1 8B
	'@cf/meta/llama-2-7b-chat-fp16': 4096, // 4k tokens
	'@cf/meta/llama-2-7b-chat-int8': 4096, // 4k tokens
	'@cf/meta-llama/llama-2-7b-chat-hf-lora': 4096, // 4k tokens
	'@cf/meta-llama/meta-llama-3-8b-instruct': 8192, // 8k tokens

	// === Mistral Models ===
	'@cf/mistralai/mistral-small-3.1-24b-instruct': 128000, // 128k tokens
	'@cf/mistral/mistral-7b-instruct-v0.1': 8192, // 8k tokens (v0.1)
	'@cf/mistral/mistral-7b-instruct-v0.2': 32768, // 32k tokens (v0.2)
	'@cf/mistral/mistral-7b-instruct-v0.2-lora': 32768, // 32k tokens

	// === Google Gemma Models ===
	'@cf/google/gemma-3-12b-it': 128000, // 128k tokens
	'@cf/google/gemma-7b-it': 8192, // 8k tokens
	'@cf/google/gemma-7b-it-lora': 8192, // 8k tokens
	'@cf/google/gemma-2b-it-lora': 8192, // 8k tokens

	// === Qwen Models ===
	'@cf/qwen/qwq-32b': 32768, // 32k tokens (reasoning model)
	'@cf/qwen/qwen2.5-coder-32b-instruct': 32768, // 32k tokens (coder model)
	'@cf/qwen/qwen1.5-14b-chat-awq': 32768, // 32k tokens
	'@cf/qwen/qwen1.5-7b-chat-awq': 32768, // 32k tokens
	'@cf/qwen/qwen1.5-1.8b-chat': 32768, // 32k tokens
	'@cf/qwen/qwen1.5-0.5b-chat': 32768, // 32k tokens

	// === DeepSeek Models ===
	'@cf/deepseek-ai/deepseek-r1-distill-qwen-32b': 32768, // 32k tokens
	'@cf/deepseek-ai/deepseek-math-7b-instruct': 4096, // 4k tokens

	// === Other Text Generation Models ===
	'@cf/tinyllama/tinyllama-1.1b-chat-v1.0': 2048, // 2k tokens
	'@cf/fblgit/una-cybertron-7b-v2-bf16': 8192, // 8k tokens
	'@cf/microsoft/phi-2': 2048, // 2k tokens
	'@cf/openchat/openchat-3.5-0106': 8192, // 8k tokens
	'@cf/tiiuae/falcon-7b-instruct': 2048, // 2k tokens
	'@cf/thebloke/discolm-german-7b-v1-awq': 8192, // 8k tokens
	'@cf/unum/uform-gen2-qwen-500m': 2048, // 2k tokens
	'@cf/defog/sqlcoder-7b-2': 8192, // 8k tokens
	'@cf/openai/gpt-oss-120b': 8192, // 8k tokens
	'@cf/openai/gpt-oss-20b': 8192, // 8k tokens
	'@cf/facebook/bart-large-cnn': 1024, // 1k tokens

	// === HuggingFace Models ===
	'@hf/nexusflow/starling-lm-7b-beta': 8192, // 8k tokens
	'@hf/thebloke/llamaguard-7b-awq': 4096, // 4k tokens
	'@hf/thebloke/neural-chat-7b-v3-1-awq': 8192, // 8k tokens
	'@hf/mistral/mistral-7b-instruct-v0.2': 32768, // 32k tokens
	'@hf/thebloke/mistral-7b-instruct-v0.1-awq': 8192, // 8k tokens
	'@hf/thebloke/llama-2-13b-chat-awq': 4096, // 4k tokens
	'@hf/thebloke/deepseek-coder-6.7b-base-awq': 4096, // 4k tokens
	'@hf/thebloke/openhermes-2.5-mistral-7b-awq': 8192, // 8k tokens
	'@hf/thebloke/deepseek-coder-6.7b-instruct-awq': 4096, // 4k tokens
	'@hf/nousresearch/hermes-2-pro-mistral-7b': 8192, // 8k tokens
	'@hf/thebloke/zephyr-7b-beta-awq': 8192, // 8k tokens
	'@hf/google/gemma-7b-it': 8192, // 8k tokens

	// === Embedding Models (Input Context) ===
	'@cf/baai/bge-base-en-v1.5': 512, // 512 tokens input
	'@cf/baai/bge-small-en-v1.5': 512, // 512 tokens input
	'@cf/baai/bge-large-en-v1.5': 512, // 512 tokens input
	'@cf/baai/bge-reranker-base': 512, // 512 tokens input
	'@cf/baai/bge-m3': 8192, // 8k tokens input

	// === Audio Models ===
	'@cf/openai/whisper': 30, // 30 seconds of audio (not tokens)
	'@cf/openai/whisper-tiny-en': 30, // 30 seconds of audio
	'@cf/openai/whisper-large-v3-turbo': 30, // 30 seconds of audio
	'@cf/myshell-ai/melotts': 4000, // ~4k characters of text input
	'@cf/meta/m2m100-1.2b': 1024, // 1k tokens

	// === Vision Models ===
	'@cf/llava-hf/llava-1.5-7b-hf': 4096, // 4k tokens + image

	// === Classification Models ===
	'@cf/huggingface/distilbert-sst-2-int8': 512, // 512 tokens
	'@cf/microsoft/resnet-50': 1, // Single image

	// === Image Generation Models ===
	'@cf/black-forest-labs/flux-1-schnell': 77, // 77 tokens prompt limit
	'@cf/bytedance/stable-diffusion-xl-lightning': 77, // 77 tokens prompt limit
	'@cf/runwayml/stable-diffusion-v1-5-img2img': 77, // 77 tokens prompt limit
	'@cf/runwayml/stable-diffusion-v1-5-inpainting': 77, // 77 tokens prompt limit
	'@cf/stabilityai/stable-diffusion-xl-base-1.0': 77, // 77 tokens prompt limit
	'@cf/lykon/dreamshaper-8-lcm': 77, // 77 tokens prompt limit

	// === Object Detection Models ===
	'@cf/facebook/detr-resnet-50': 1, // Single image
};

// === ORIGINAL MODEL CATEGORIES ===
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

// === INTEGRATED HELPER FUNCTIONS ===

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

// **UPDATED: Context window function using the mapping**
export const getModelContextWindow = modelName => {
	const contextWindow = MODEL_CONTEXT_WINDOWS[modelName];
	if (!contextWindow) {
		console.warn(`Context window not found for model: ${modelName}. Using default 4096.`);
		return 4096; // Default fallback
	}
	return contextWindow;
};

// Helper function to validate if a model has context window info
export const isModelSupported = modelName => {
	return modelName in MODEL_CONTEXT_WINDOWS;
};

// Helper function to calculate a sensible max_tokens default for a model
export const calculateDefaultMaxTokens = (modelName, reservePercentage = 10) => {
	const contextWindow = getModelContextWindow(modelName);
	// Reserve a percentage of the context window for the prompt and safety buffer
	const reserveTokens = Math.floor(contextWindow * (reservePercentage / 100));
	// Return a reasonable default max_tokens value (at least 100 tokens, no more than 90% of context)
	const maxTokens = Math.max(100, contextWindow - reserveTokens);
	return maxTokens > 0 ? maxTokens : 1024; // Ensure we always return a positive number
};

// Helper function to get all models with context windows above a threshold
export const getModelsWithContextAbove = threshold => {
	return Object.entries(MODEL_CONTEXT_WINDOWS)
		.filter(([model, contextWindow]) => contextWindow >= threshold)
		.map(([model]) => model);
};

// Helper function to get models grouped by context window size
export const getModelsByContextWindow = () => {
	const grouped = {};
	Object.entries(MODEL_CONTEXT_WINDOWS).forEach(([model, contextWindow]) => {
		if (!grouped[contextWindow]) {
			grouped[contextWindow] = [];
		}
		grouped[contextWindow].push(model);
	});
	return grouped;
};

// Context window statistics
export const getContextWindowStats = () => {
	const windows = Object.values(MODEL_CONTEXT_WINDOWS);
	return {
		total_models: windows.length,
		min_context: Math.min(...windows),
		max_context: Math.max(...windows),
		average_context: Math.round(windows.reduce((a, b) => a + b, 0) / windows.length),
		models_with_128k_plus: windows.filter(w => w >= 128000).length,
		models_with_32k_plus: windows.filter(w => w >= 32768).length,
		models_with_8k_plus: windows.filter(w => w >= 8192).length,
		models_with_large_context: getModelsWithContextAbove(128000),
		models_with_medium_context: getModelsWithContextAbove(32768).filter(
			m => MODEL_CONTEXT_WINDOWS[m] < 128000
		),
	};
};

// Helper to get optimal model for context size requirement
export const getOptimalModelForContext = (
	requiredContext,
	category = 'chat',
	capabilities = []
) => {
	const categoryModels = MODEL_CATEGORIES[category] || [];

	const suitableModels = categoryModels.filter(model => {
		const contextWindow = MODEL_CONTEXT_WINDOWS[model];
		const modelCapabilities = MODEL_CAPABILITIES[model] || [];

		// Check context window requirement
		if (contextWindow < requiredContext) return false;

		// Check capability requirements
		if (capabilities.length > 0) {
			return capabilities.some(cap => modelCapabilities.includes(cap));
		}

		return true;
	});

	// Sort by context window (smallest that meets requirements first for efficiency)
	return suitableModels.sort((a, b) => MODEL_CONTEXT_WINDOWS[a] - MODEL_CONTEXT_WINDOWS[b]);
};

// Model recommendation based on use case
export const getModelRecommendation = useCase => {
	const recommendations = {
		'long-context': getModelsWithContextAbove(128000),
		'coding': getModelsByCapability('code-generation'),
		'vision': getModelsByCapability('vision'),
		'reasoning': getModelsByCapability('reasoning'),
		'multilingual': ['@cf/baai/bge-m3', '@cf/meta/llama-3.2-11b-vision-instruct'],
		'fast-inference': [
			'@cf/meta/llama-3.2-1b-instruct',
			'@cf/tinyllama/tinyllama-1.1b-chat-v1.0',
			'@cf/qwen/qwen1.5-0.5b-chat',
		],
		'balanced': [
			'@cf/meta/llama-3.1-8b-instruct-fp8',
			'@cf/meta/llama-3-8b-instruct',
			'@cf/google/gemma-7b-it',
		],
	};

	return recommendations[useCase] || [];
};
