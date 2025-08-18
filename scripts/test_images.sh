#!/bin/bash

# Simple test script for image generation endpoints
# Tests the /v1/images/generations endpoint

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-change_this_token}"

echo "Testing image generation endpoint at $WORKER_URL"

# Test basic image generation
echo "Testing image generation..."
curl -X POST "$WORKER_URL/images/generations" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "dall-e-3",
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "1024x1024"
  }'

echo -e "\nAll image generation tests completed!"
