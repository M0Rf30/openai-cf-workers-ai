#!/bin/bash

# Simple test runner for all endpoints
# Runs all individual test scripts

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"

export WORKER_URL
export AUTH_TOKEN

echo "Running all tests for $WORKER_URL"

# Make all test scripts executable
chmod +x scripts/test_*.sh

echo "=== Testing Models ==="
./scripts/test_models.sh

echo -e "\n=== Testing Completions ==="
./scripts/test_completions.sh

echo -e "\n=== Testing Embeddings ==="
./scripts/test_embeddings.sh

echo -e "\n=== Testing Audio ==="
./scripts/test_audio.sh

echo -e "\n=== Testing Images ==="
./scripts/test_images.sh

echo -e "\n🎉 All tests completed!"