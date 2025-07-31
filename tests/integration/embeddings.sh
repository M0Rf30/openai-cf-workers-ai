# Replace YOUR_WORKER_URL with your actual Cloudflare Worker URL
AUTH_TOKEN="01341be598a3ecd5e15d5dca917c87b963e0121858e7e9f8b6a265a8fe600f92"
WORKER_URL="https://ai.eaglestek-informatica.workers.dev/v1"

# Test 1: Basic single text embedding (using default model)
echo "=== Test 1: Basic single text embedding ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": "Hello, this is a test sentence for embeddings."
  }' | jq '.'

echo -e "\n"

# Test 2: Single text with specific model
echo "=== Test 2: Single text with specific model ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": "This is a test with a specific model.",
    "model": "@cf/baai/bge-base-en-v1.5"
  }' | jq '.'

echo -e "\n"

# Test 3: Batch embeddings (multiple texts)
echo "=== Test 3: Batch embeddings ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": [
      "This is the first sentence.",
      "This is the second sentence.",
      "This is the third sentence."
    ],
    "model": "@cf/baai/bge-base-en-v1.5"
  }' | jq '.'

echo -e "\n"

# Test 4: Using different model (small)
echo "=== Test 4: Using small model ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": "Testing with the small model.",
    "model": "@cf/baai/bge-small-en-v1.5"
  }' | jq '.'

echo -e "\n"

# Test 5: Using cls pooling
echo "=== Test 5: Using cls pooling ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": "Testing with cls pooling method.",
    "model": "@cf/baai/bge-base-en-v1.5",
    "pooling": "cls"
  }' | jq '.'

echo -e "\n"

# Test 6: Health check
echo "=== Test 6: Health check ==="
curl -X GET "$WORKER_URL/health" | jq '.'

echo -e "\n"

# Test 7: Error test - unsupported model
echo "=== Test 7: Error test - unsupported model ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": "This should fail with unsupported model.",
    "model": "text-embedding-ada-002"
  }' | jq '.'

echo -e "\n"

# Test 8: Error test - missing input
echo "=== Test 8: Error test - missing input ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "model": "@cf/baai/bge-base-en-v1.5"
  }' | jq '.'

echo -e "\n"

# Test 9: Error test - wrong content type
echo "=== Test 9: Error test - wrong content type ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: text/plain" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "This should fail" | jq '.'

echo -e "\n"

# Test 10: Large batch test (10 items)
echo "=== Test 10: Large batch test ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": [
      "Sentence 1 for batch processing test.",
      "Sentence 2 for batch processing test.",
      "Sentence 3 for batch processing test.",
      "Sentence 4 for batch processing test.",
      "Sentence 5 for batch processing test.",
      "Sentence 6 for batch processing test.",
      "Sentence 7 for batch processing test.",
      "Sentence 8 for batch processing test.",
      "Sentence 9 for batch processing test.",
      "Sentence 10 for batch processing test."
    ],
    "model": "@cf/baai/bge-base-en-v1.5"
  }' | jq '.data | length'

echo -e "\n"

# Test 11: Check embedding dimensions
echo "=== Test 11: Check embedding dimensions ==="
curl -X POST "$WORKER_URL/embeddings" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "input": "Check the dimension of this embedding.",
    "model": "@cf/baai/bge-base-en-v1.5"
  }' | jq '.data[0].embedding | length'
