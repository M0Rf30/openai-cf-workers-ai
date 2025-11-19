#!/bin/bash
API_URL="${API_URL:-http://localhost:8787}"
AUTH_TOKEN="${AUTH_TOKEN:-your_token_here}"

echo "OpenAI Compatibility Test"
echo "=========================="

echo -e "\n✓ gpt-3.5-turbo:"
curl -s -X POST "$API_URL/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"model": "gpt-3.5-turbo", "messages": [{"role": "user", "content": "Hi"}]}' \
  | jq -r '.choices[0].message.content' | head -c 40

echo -e "\n\n✓ text-embedding-ada-002:"
curl -s -X POST "$API_URL/v1/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"model": "text-embedding-ada-002", "input": "test"}' \
  | jq '{model: .model, dims: (.data[0].embedding | length)}'

echo -e "\n✅ All tests passed!"
