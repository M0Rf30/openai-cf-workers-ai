# Test Scripts

Simple test scripts for each API endpoint.

## Available Scripts

- `test_all.sh` - Run all tests
- `test_audio.sh` - Test audio endpoints (transcription, translation, TTS)
- `test_completions.sh` - Test chat completions
- `test_embeddings.sh` - Test embeddings
- `test_images.sh` - Test image generation
- `test_models.sh` - Test models endpoint
- `test_rag.sh` - Test RAG endpoints

## Usage

```bash
# Run all tests
./test_all.sh

# Run specific endpoint tests
./test_audio.sh
./test_completions.sh
./test_embeddings.sh
./test_images.sh
./test_models.sh
./test_rag.sh
```

You can also use npm commands:

```bash
npm run test:all      # Run all tests
npm run test:audio    # Test audio endpoints
npm run test:completions # Test chat completions
npm run test:embeddings  # Test embeddings
npm run test:images   # Test image generation
npm run test:models   # Test models endpoint
npm run test:rag      # Test RAG endpoints
```
