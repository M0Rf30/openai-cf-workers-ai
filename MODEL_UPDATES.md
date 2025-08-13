# Model Updates

This document summarizes the updates made to the model list based on the latest models available from the Cloudflare Workers AI API.

## Changes Made

1. **Updated Model Categories**: Added new models to various categories including:
   - Chat models
   - Completion models
   - Embedding models
   - Audio models
   - Image generation models
   - Vision models
   - Classification models
   - Reranking models

2. **Enhanced Model Mappings**: Added new OpenAI-compatible model name mappings for:
   - Chat models (gpt-4o, gpt-4o-mini, gpt-4-turbo, etc.)
   - Vision models (gpt-4-vision-preview)
   - Code models (gpt-3.5-turbo-instruct, code-davinci-002)
   - Reranking models (rerank-001)
   - Classification models (text-moderation-latest, text-moderation-stable)

3. **Expanded Model Capabilities**: Added capability mappings for new models including:
   - Code generation capabilities
   - Math reasoning capabilities
   - SQL generation capabilities
   - Vision capabilities
   - Image classification capabilities
   - Reranking capabilities

## New Models Added

### Chat and Completion Models
- `@cf/qwen/qwen2.5-coder-32b-instruct` - Added with code generation capabilities
- `@cf/deepseek-ai/deepseek-math-7b-instruct` - Added with math reasoning capabilities
- `@cf/tiiuae/falcon-7b-instruct` - General purpose chat model
- `@cf/thebloke/discolm-german-7b-v1-awq` - German language model
- `@cf/meta-llama/llama-2-7b-chat-hf-lora` - Llama 2 variant
- `@cf/defog/sqlcoder-7b-2` - SQL-focused model
- `@cf/openai/gpt-oss-120b` and `@cf/openai/gpt-oss-20b` - Open source GPT models

### Embedding and Reranking Models
- `@cf/baai/bge-m3` - Multilingual embedding model
- `@cf/baai/bge-reranker-base` - Reranking model

### Vision Models
- `@cf/llava-hf/llava-1.5-7b-hf` - Vision language model
- `@cf/unum/uform-gen2-qwen-500m` - Vision model

## Updated Mappings

### New OpenAI-Compatible Mappings
- `gpt-4o` → `@cf/meta/llama-3.2-11b-vision-instruct`
- `gpt-4o-mini` → `@cf/meta/llama-3.2-3b-instruct`
- `gpt-4-turbo` → `@cf/meta/llama-3.1-8b-instruct-awq`
- `gpt-3.5-turbo-instruct` → `@cf/qwen/qwen2.5-coder-32b-instruct`
- `code-davinci-002` → `@cf/qwen/qwen2.5-coder-32b-instruct`
- `gpt-4-vision-preview` → `@cf/meta/llama-3.2-11b-vision-instruct`
- `rerank-001` → `@cf/baai/bge-reranker-base`
- `text-moderation-latest` → `@cf/meta/llama-guard-3-8b`
- `text-moderation-stable` → `@cf/meta/llama-guard-3-8b`

These updates ensure the API supports the latest models available in Cloudflare Workers AI while maintaining compatibility with OpenAI's API conventions.