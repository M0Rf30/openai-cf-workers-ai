# Test Scripts

Simple test scripts for each API endpoint.

## Model Update Script

**`update-models.js`** - Auto-update Cloudflare Workers AI models

Fetches the latest models from the Cloudflare Workers AI API and generates/updates the `utils/models.js` configuration file.

**Usage:**

```bash
# Normal mode (updates files)
npm run update-models

# Dry-run mode (preview changes without writing)
npm run update-models:dry-run
```

**Environment Variables Required:**

- `CLOUDFLARE_ACCOUNT_ID` - Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN` - Your Cloudflare API token with Workers AI permissions

**Features:**

- Fetches models directly from Cloudflare's catalog API
- Filters out deprecated models
- Organizes models by category and capability
- Preserves manual context window overrides
- Generates type-safe helper functions
- Maintains OpenAI-compatible model mappings

**Automation:**
This script runs automatically via GitHub Actions every Monday at 9 AM UTC. See `.github/workflows/update-models.yml` for details.

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
