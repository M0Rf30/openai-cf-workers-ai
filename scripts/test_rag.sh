#!/bin/bash

# Simple test script for RAG endpoints
# Tests the /v1/rag/* endpoints

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-change_this_token}"

echo "Testing RAG endpoints at $WORKER_URL"

# Test storing a document
echo "Testing document storage..."
curl -X POST "$WORKER_URL/rag/documents" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog. This is a sample document for testing RAG functionality.",
    "metadata": {
      "docId": "test-doc-1",
      "title": "Test Document",
      "category": "sample"
    }
  }'

echo -e "\nTesting RAG search..."
curl -X POST "$WORKER_URL/rag/search" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is RAG functionality?",
    "top_k": 3
  }'

echo -e "\nTesting RAG chat..."
curl -X POST "$WORKER_URL/rag/chat" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Explain what RAG is based on the stored documents."
      }
    ]
  }'

echo -e "\nAll RAG tests completed!"
