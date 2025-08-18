# Cloudflare Workers AI Models

This document provides comprehensive information about all models available in Cloudflare Workers AI, including their capabilities, context windows, and performance characteristics.

## Model Categories

Models in Cloudflare Workers AI are organized into several categories based on their primary functions:

- **Chat/Text Generation**: Conversational AI models
- **Embeddings**: Text embedding models for similarity and retrieval
- **Audio**: Speech-to-text, text-to-speech, and translation models
- **Image Generation**: Text-to-image models
- **Vision**: Models that can process both text and images
- **Classification**: Text and image classification models
- **Reranking**: Models for improving search result relevance

## Context Windows

Context windows determine the maximum amount of text a model can process in a single request. Understanding context windows is crucial for:

- Determining model suitability for your use case
- Setting appropriate `max_tokens` values
- Managing token usage and costs

## Chat and Text Generation Models

These models are designed for conversational AI and text generation tasks.

### High-Performance Models (128K+ Context)

| Model ID                                   | Context Window | Description                         |
| ------------------------------------------ | -------------- | ----------------------------------- |
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 128,000 tokens | Most powerful general-purpose model |
| `@cf/meta/llama-3.1-70b-instruct`          | 128,000 tokens | Powerful reasoning and generation   |
| `@cf/meta/llama-3.1-8b-instruct`           | 128,000 tokens | Balanced performance and speed      |
| `@cf/meta/llama-3.1-8b-instruct-fast`      | 128,000 tokens | Optimized for speed                 |
| `@cf/meta/llama-3.1-8b-instruct-fp8`       | 128,000 tokens | FP8 quantized for efficiency        |
| `@cf/meta/llama-3.1-8b-instruct-awq`       | 128,000 tokens | AWQ quantized for efficiency        |
| `@cf/meta/llama-3.2-3b-instruct`           | 128,000 tokens | Efficient small model               |
| `@cf/meta/llama-3.2-11b-vision-instruct`   | 128,000 tokens | Multimodal vision model             |
| `@cf/google/gemma-3-12b-it`                | 128,000 tokens | Google's instruction-tuned model    |

### Medium-Context Models (32K Context)

| Model ID                                       | Context Window | Description                  |
| ---------------------------------------------- | -------------- | ---------------------------- |
| `@cf/qwen/qwq-32b`                             | 32,768 tokens  | Specialized reasoning model  |
| `@cf/qwen/qwen2.5-coder-32b-instruct`          | 32,768 tokens  | Specialized coding model     |
| `@cf/mistral/mistral-7b-instruct-v0.2`         | 32,768 tokens  | Improved Mistral model       |
| `@cf/mistral/mistral-7b-instruct-v0.2-lora`    | 32,768 tokens  | LoRA-tuned Mistral           |
| `@cf/qwen/qwen1.5-14b-chat-awq`                | 32,768 tokens  | AWQ quantized Qwen           |
| `@cf/qwen/qwen1.5-7b-chat-awq`                 | 32,768 tokens  | AWQ quantized Qwen           |
| `@cf/qwen/qwen1.5-1.8b-chat`                   | 32,768 tokens  | Lightweight Qwen             |
| `@cf/qwen/qwen1.5-0.5b-chat`                   | 32,768 tokens  | Ultra-lightweight Qwen       |
| `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 32,768 tokens  | Distilled reasoning model    |
| `@cf/baai/bge-m3`                              | 8,192 tokens   | Multilingual embedding model |

### Standard-Context Models (8K Context)

| Model ID                                  | Context Window | Description              |
| ----------------------------------------- | -------------- | ------------------------ |
| `@cf/meta/llama-3-8b-instruct`            | 8,192 tokens   | Original Llama 3 model   |
| `@cf/meta/llama-3-8b-instruct-awq`        | 8,192 tokens   | AWQ quantized Llama 3    |
| `@cf/meta-llama/meta-llama-3-8b-instruct` | 8,192 tokens   | Meta's official Llama 3  |
| `@cf/mistral/mistral-7b-instruct-v0.1`    | 8,192 tokens   | Original Mistral model   |
| `@cf/google/gemma-7b-it`                  | 8,192 tokens   | Google's Gemma model     |
| `@cf/google/gemma-7b-it-lora`             | 8,192 tokens   | LoRA-tuned Gemma         |
| `@cf/fblgit/una-cybertron-7b-v2-bf16`     | 8,192 tokens   | Cybertron model          |
| `@cf/thebloke/discolm-german-7b-v1-awq`   | 8,192 tokens   | German language model    |
| `@cf/defog/sqlcoder-7b-2`                 | 8,192 tokens   | SQL-focused model        |
| `@cf/unum/uform-gen2-qwen-500m`           | 2,048 tokens   | Lightweight vision model |

### Efficient Models (4K Context or Less)

| Model ID                                 | Context Window | Description              |
| ---------------------------------------- | -------------- | ------------------------ |
| `@cf/meta/llama-2-7b-chat-fp16`          | 4,096 tokens   | Llama 2 FP16 model       |
| `@cf/meta/llama-2-7b-chat-int8`          | 4,096 tokens   | Llama 2 INT8 model       |
| `@cf/meta-llama/llama-2-7b-chat-hf-lora` | 4,096 tokens   | LoRA-tuned Llama 2       |
| `@cf/meta/llama-guard-3-8b`              | 8,192 tokens   | Content moderation model |
| `@cf/tinyllama/tinyllama-1.1b-chat-v1.0` | 2,048 tokens   | Ultra-lightweight model  |
| `@cf/microsoft/phi-2`                    | 2,048 tokens   | Microsoft's Phi-2 model  |
| `@cf/tiiuae/falcon-7b-instruct`          | 2,048 tokens   | Falcon model             |
| `@cf/facebook/bart-large-cnn`            | 1,024 tokens   | Summarization model      |
| `@cf/google/gemma-2b-it-lora`            | 8,192 tokens   | LoRA-tuned small Gemma   |

## Embedding Models

These models convert text into numerical vectors for similarity comparisons and retrieval tasks.

| Model ID                     | Input Context | Output Dimensions | Description                  |
| ---------------------------- | ------------- | ----------------- | ---------------------------- |
| `@cf/baai/bge-large-en-v1.5` | 512 tokens    | 1,024             | Most capable embedding model |
| `@cf/baai/bge-base-en-v1.5`  | 512 tokens    | 768               | Balanced performance         |
| `@cf/baai/bge-small-en-v1.5` | 512 tokens    | 384               | Efficient small model        |
| `@cf/baai/bge-reranker-base` | 512 tokens    | N/A               | Reranking model              |
| `@cf/baai/bge-m3`            | 8,192 tokens  | 1,024             | Multilingual model           |

## Audio Models

These models handle speech-to-text, text-to-speech, and translation tasks.

### Speech-to-Text (Transcription)

| Model ID                            | Audio Limit | Description                    |
| ----------------------------------- | ----------- | ------------------------------ |
| `@cf/openai/whisper-large-v3-turbo` | 30 seconds  | Most accurate model            |
| `@cf/openai/whisper`                | 30 seconds  | Standard Whisper model         |
| `@cf/openai/whisper-tiny-en`        | 30 seconds  | Lightweight English-only model |

### Text-to-Speech

| Model ID                 | Text Limit   | Description        |
| ------------------------ | ------------ | ------------------ |
| `@cf/myshell-ai/melotts` | ~4,000 chars | Multi-language TTS |

### Translation

| Model ID               | Context      | Description              |
| ---------------------- | ------------ | ------------------------ |
| `@cf/meta/m2m100-1.2b` | 1,024 tokens | Multilingual translation |

### Language Detection

| Model ID                        | Context      | Description                   |
| ------------------------------- | ------------ | ----------------------------- |
| `@cf/meta/llama-2-7b-chat-int8` | 4,096 tokens | Language detection capability |

## Image Generation Models

These models generate images from text prompts.

| Model ID                                        | Prompt Limit | Description                  |
| ----------------------------------------------- | ------------ | ---------------------------- |
| `@cf/black-forest-labs/flux-1-schnell`          | 77 tokens    | Most modern image generation |
| `@cf/bytedance/stable-diffusion-xl-lightning`   | 77 tokens    | Fast SDXL model              |
| `@cf/stabilityai/stable-diffusion-xl-base-1.0`  | 77 tokens    | Standard SDXL model          |
| `@cf/lykon/dreamshaper-8-lcm`                   | 77 tokens    | Dreamshaper model            |
| `@cf/runwayml/stable-diffusion-v1-5-img2img`    | 77 tokens    | Image-to-image generation    |
| `@cf/runwayml/stable-diffusion-v1-5-inpainting` | 77 tokens    | Image inpainting             |

## Vision Models

These models can process both text and images.

| Model ID                                 | Context Window | Description              |
| ---------------------------------------- | -------------- | ------------------------ |
| `@cf/meta/llama-3.2-11b-vision-instruct` | 128,000 tokens | Latest multimodal model  |
| `@cf/llava-hf/llava-1.5-7b-hf`           | 4,096 tokens   | LLaVA model              |
| `@cf/unum/uform-gen2-qwen-500m`          | 2,048 tokens   | Lightweight vision model |

## Classification Models

These models classify text or images into categories.

### Text Classification

| Model ID                                | Context Window | Description        |
| --------------------------------------- | -------------- | ------------------ |
| `@cf/huggingface/distilbert-sst-2-int8` | 512 tokens     | Sentiment analysis |

### Image Classification

| Model ID                  | Input   | Description                  |
| ------------------------- | ------- | ---------------------------- |
| `@cf/microsoft/resnet-50` | 1 image | General image classification |

## OpenAI-Compatible Model Mappings

For compatibility with OpenAI clients, the following mappings are used:

| OpenAI Model             | Cloudflare Model                               | Context Window |
| ------------------------ | ---------------------------------------------- | -------------- |
| `gpt-3.5-turbo`          | `@cf/meta/llama-3.1-8b-instruct-fp8`           | 128K tokens    |
| `gpt-3.5-turbo-16k`      | `@cf/qwen/qwq-32b`                             | 32K tokens     |
| `gpt-4`                  | `@cf/meta/llama-3.3-70b-instruct-fp8-fast`     | 128K tokens    |
| `gpt-4-turbo`            | `@cf/meta/llama-3.3-70b-instruct-fp8-fast`     | 128K tokens    |
| `gpt-4o`                 | `@cf/meta/llama-3.2-11b-vision-instruct`       | 128K tokens    |
| `gpt-4o-mini`            | `@cf/meta/llama-3.2-3b-instruct`               | 128K tokens    |
| `gpt-4-32k`              | `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` | 32K tokens     |
| `text-embedding-ada-002` | `@cf/baai/bge-base-en-v1.5`                    | 512 tokens     |
| `text-embedding-3-small` | `@cf/baai/bge-small-en-v1.5`                   | 512 tokens     |
| `text-embedding-3-large` | `@cf/baai/bge-large-en-v1.5`                   | 512 tokens     |
| `whisper-1`              | `@cf/openai/whisper-large-v3-turbo`            | 30 seconds     |
| `whisper`                | `@cf/openai/whisper-large-v3-turbo`            | 30 seconds     |
| `whisper-tiny-en`        | `@cf/openai/whisper-tiny-en`                   | 30 seconds     |
| `whisper-large-v3-turbo` | `@cf/openai/whisper-large-v3-turbo`            | 30 seconds     |
| `tts-1`                  | `@cf/myshell-ai/melotts`                       | ~4K characters |
| `tts-1-hd`               | `@cf/myshell-ai/melotts`                       | ~4K characters |
| `dall-e-2`               | `@cf/black-forest-labs/flux-1-schnell`         | 77 tokens      |
| `dall-e-3`               | `@cf/black-forest-labs/flux-1-schnell`         | 77 tokens      |

## Model Capabilities

Models have different capabilities depending on their training and intended use:

- **text-generation**: Basic text generation
- **function-calling**: Can call functions/tools
- **vision**: Can process images
- **embeddings**: Generate text embeddings
- **speech-to-text**: Convert speech to text
- **text-to-speech**: Convert text to speech
- **translation**: Translate between languages
- **reranking**: Improve search result relevance
- **content-moderation**: Detect inappropriate content
- **code-generation**: Generate or understand code
- **reasoning**: Enhanced logical reasoning
- **math**: Mathematical problem solving
- **summarization**: Text summarization
- **sentiment-analysis**: Determine text sentiment
- **image-generation**: Create images from text
- **image-classification**: Classify images
- **language-detection**: Identify text language
- **multilingual**: Support for multiple languages

## Performance Considerations

When selecting models, consider:

1. **Context Window**: Ensure the model can handle your input size
2. **Latency**: Larger models typically have higher latency
3. **Cost**: More powerful models may have higher usage costs
4. **Capabilities**: Match model capabilities to your requirements
5. **Specialization**: Some models are optimized for specific tasks

## Model Recommendations

### For General Chat Applications

- `@cf/meta/llama-3.3-70b-instruct-fp8-fast` - Best overall performance
- `@cf/meta/llama-3.1-8b-instruct-fp8` - Good balance of performance and efficiency

### For Long Context Applications

- `@cf/meta/llama-3.1-70b-instruct` - 128K context window
- `@cf/meta/llama-3.1-8b-instruct` - 128K context window

### For Coding Applications

- `@cf/qwen/qwen2.5-coder-32b-instruct` - Specialized for code
- `@cf/defog/sqlcoder-7b-2` - SQL-focused

### For Reasoning Applications

- `@cf/qwen/qwq-32b` - Specialized reasoning model
- `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` - Distilled reasoning

### For Multimodal Applications

- `@cf/meta/llama-3.2-11b-vision-instruct` - Latest vision model

### For Embedding Applications

- `@cf/baai/bge-large-en-v1.5` - Most capable embedding model
- `@cf/baai/bge-m3` - Multilingual support

### For Cost-Efficient Applications

- `@cf/meta/llama-3.2-3b-instruct` - Efficient small model
- `@cf/qwen/qwen1.5-0.5b-chat` - Ultra-lightweight model
