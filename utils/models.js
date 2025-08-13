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

	audio_tts: [
		'@cf/myshell-ai/melotts',
	],

	audio_translation: [
		'@cf/meta/m2m100-1.2b',
	],

	audio_language_detection: [
		'@cf/meta/llama-2-7b-chat-int8',
	],

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

	classification: [
		'@cf/huggingface/distilbert-sst-2-int8',
		'@cf/microsoft/resnet-50',
	],

	reranking: [
		'@cf/baai/bge-reranker-base',
	],

	rag: [
		'@cf/baai/bge-base-en-v1.5',
		'@cf/baai/bge-small-en-v1.5',
		'@cf/baai/bge-large-en-v1.5',
		'@cf/baai/bge-reranker-base',
		'@cf/baai/bge-m3',
	]
};

// OpenAI-compatible model name mappings
export const MODEL_MAPPING = {
	// Chat models
	'gpt-3.5-turbo': '@cf/meta/llama-3.1-8b-instruct-fp8',
	'gpt-4': '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
	'gpt-4o': '@cf/meta/llama-3.2-11b-vision-instruct',
	'gpt-4-turbo': '@cf/meta/llama-3.1-8b-instruct-awq',
	'gpt-3.5-turbo-16k': '@cf/meta/llama-3-8b-instruct',
	'gpt-4-32k': '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',

	// Embedding models
	'text-embedding-ada-002': '@cf/baai/bge-base-en-v1.5',
	'text-embedding-3-small': '@cf/baai/bge-small-en-v1.5',
	'text-embedding-3-large': '@cf/baai/bge-large-en-v1.5',

	// Audio models
	'whisper-1': '@cf/openai/whisper',
	'whisper': '@cf/openai/whisper',
	'whisper-tiny-en': '@cf/openai/whisper-tiny-en',
	'whisper-large-v3-turbo': '@cf/openai/whisper-large-v3-turbo',
	'tts-1': '@cf/myshell-ai/melotts',
	'tts-1-hd': '@cf/myshell-ai/melotts',

	// Image models
	'dall-e-2': '@cf/black-forest-labs/flux-1-schnell',
	'dall-e-3': '@cf/black-forest-labs/flux-1-schnell',

	// Vision models
	'gpt-4-vision-preview': '@cf/meta/llama-3.2-11b-vision-instruct',
	'gpt-4o-mini': '@cf/meta/llama-3.2-3b-instruct',

	// Classification models
	'text-moderation-latest': '@cf/meta/llama-guard-3-8b',
	'text-moderation-stable': '@cf/meta/llama-guard-3-8b',

	// Code models
	'gpt-3.5-turbo-instruct': '@cf/qwen/qwen2.5-coder-32b-instruct',
	'code-davinci-002': '@cf/qwen/qwen2.5-coder-32b-instruct',

	// Reranking models
	'rerank-001': '@cf/baai/bge-reranker-base',
};

// Reverse mapping for API responses
export const REVERSE_MODEL_MAPPING = Object.fromEntries(
	Object.entries(MODEL_MAPPING).map(([openai, cf]) => [cf, openai])
);

// Model capabilities
export const MODEL_CAPABILITIES = {
	// Chat models
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
	'@cf/deepseek-ai/deepseek-r1-distill-qwen-32b': ['text-generation'],
	'@cf/meta/llama-2-7b-chat-int8': ['text-generation', 'language-detection'],
	'@cf/qwen/qwen1.5-7b-chat-awq': ['text-generation'],
	'@cf/meta/llama-3.2-1b-instruct': ['text-generation'],
	'@cf/mistralai/mistral-small-3.1-24b-instruct': ['text-generation'],
	'@cf/meta/llama-3.1-8b-instruct-awq': ['text-generation'],
	'@cf/google/gemma-7b-it-lora': ['text-generation'],
	'@cf/qwen/qwen1.5-1.8b-chat': ['text-generation'],
	'@cf/meta/llama-3-8b-instruct-awq': ['text-generation'],
	'@cf/meta/llama-3.2-11b-vision-instruct': ['text-generation', 'vision'],
	'@cf/microsoft/phi-2': ['text-generation'],
	'@cf/qwen/qwen1.5-14b-chat-awq': ['text-generation'],
	'@cf/openchat/openchat-3.5-0106': ['text-generation'],
	'@cf/meta/llama-4-scout-17b-16e-instruct': ['text-generation'],
	'@cf/google/gemma-3-12b-it': ['text-generation'],
	'@cf/qwen/qwq-32b': ['text-generation'],
	'@cf/qwen/qwen2.5-coder-32b-instruct': ['text-generation', 'code-generation'],
	'@cf/deepseek-ai/deepseek-math-7b-instruct': ['text-generation', 'math'],
	'@cf/tiiuae/falcon-7b-instruct': ['text-generation'],
	'@cf/thebloke/discolm-german-7b-v1-awq': ['text-generation'],
	'@cf/meta-llama/llama-2-7b-chat-hf-lora': ['text-generation'],
	'@cf/unum/uform-gen2-qwen-500m': ['vision'],
	'@cf/defog/sqlcoder-7b-2': ['text-generation', 'sql'],
	'@cf/openai/gpt-oss-120b': ['text-generation'],
	'@cf/openai/gpt-oss-20b': ['text-generation'],

	// Embedding models
	'@cf/baai/bge-base-en-v1.5': ['embeddings'],
	'@cf/baai/bge-small-en-v1.5': ['embeddings'],
	'@cf/baai/bge-large-en-v1.5': ['embeddings'],
	'@cf/baai/bge-reranker-base': ['reranking'],
	'@cf/baai/bge-m3': ['embeddings', 'reranking'],

	// Audio models
	'@cf/openai/whisper': ['speech-to-text'],
	'@cf/openai/whisper-tiny-en': ['speech-to-text'],
	'@cf/openai/whisper-large-v3-turbo': ['speech-to-text'],
	'@cf/myshell-ai/melotts': ['text-to-speech'],
	'@cf/meta/m2m100-1.2b': ['translation'],

	// Image models
	'@cf/black-forest-labs/flux-1-schnell': ['image-generation'],
	'@cf/bytedance/stable-diffusion-xl-lightning': ['image-generation'],
	'@cf/runwayml/stable-diffusion-v1-5-img2img': ['image-generation'],
	'@cf/runwayml/stable-diffusion-v1-5-inpainting': ['image-generation'],
	'@cf/stabilityai/stable-diffusion-xl-base-1.0': ['image-generation'],
	'@cf/lykon/dreamshaper-8-lcm': ['image-generation'],

	// Vision models
	'@cf/meta/llama-3.2-11b-vision-instruct': ['text-generation', 'vision'],
	'@cf/llava-hf/llava-1.5-7b-hf': ['vision'],

	// Classification models
	'@cf/huggingface/distilbert-sst-2-int8': ['classification'],
	'@cf/microsoft/resnet-50': ['image-classification'],

	// Reranking models
	'@cf/baai/bge-reranker-base': ['reranking'],
};

// Default models for each category
export const DEFAULT_MODELS = {
	chat: '@cf/meta/llama-3.1-8b-instruct-fp8',
	completion: '@cf/mistral/mistral-7b-instruct-v0.1',
	embeddings: '@cf/baai/bge-base-en-v1.5',
	audio_stt: '@cf/openai/whisper',
	audio_tts: '@cf/myshell-ai/melotts',
	audio_translation: '@cf/meta/m2m100-1.2b',
	audio_language_detection: '@cf/meta/llama-2-7b-chat-int8',
	image_generation: '@cf/black-forest-labs/flux-1-schnell',
	vision: '@cf/meta/llama-3.2-11b-vision-instruct',
	classification: '@cf/huggingface/distilbert-sst-2-int8',
	reranking: '@cf/baai/bge-reranker-base',
	rag: '@cf/baai/bge-base-en-v1.5',
};
