#!/bin/bash

# Simple test script for completions endpoints
# Tests the /v1/chat/completions endpoint

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"

echo "Testing completions endpoint at $WORKER_URL"

# Test basic chat completion
echo "Testing chat completion..."
curl -X POST "$WORKER_URL/chat/completions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'

echo -e "\nTesting chat completion with streaming..."
curl -X POST "$WORKER_URL/chat/completions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {"role": "user", "content": "Count to 5."}
    ],
    "stream": true
  }'

echo -e "\nAll completions tests completed!"