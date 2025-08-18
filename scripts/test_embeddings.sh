#!/bin/bash

# Simple test script for embeddings endpoints
# Tests the /v1/embeddings endpoint

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"

echo "Testing embeddings endpoint at $WORKER_URL"

# Test basic embeddings
echo "Testing embeddings..."
curl -X POST "$WORKER_URL/embeddings" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "Hello, world!"
  }'

echo -e "\nAll embeddings tests completed!"