#!/bin/bash

# OpenAI-Compatible API Integration Tests
# Tests the deployed Cloudflare Worker with comprehensive endpoint coverage

set -e

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"
AUDIO_FILE="$(dirname "$0")/../fixtures/test_speech.wav"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Utility functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((TESTS_PASSED++))
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((TESTS_FAILED++))
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

run_test() {
  local test_name="$1"
  local curl_command="$2"
  local expected_status="${3:-200}"
  local validation_func="$4"

  ((TESTS_RUN++))
  log_info "Running test: $test_name"

  # Run the curl command and capture response
  local response_file=$(mktemp)
  local http_code

  if http_code=$(eval "$curl_command -w '%{http_code}' -s -o '$response_file'"); then
    if [[ "$http_code" == "$expected_status" ]]; then
      if [[ -n "$validation_func" ]]; then
        if $validation_func "$response_file"; then
          log_success "$test_name (HTTP $http_code)"
        else
          log_error "$test_name - Validation failed"
        fi
      else
        log_success "$test_name (HTTP $http_code)"
      fi
    else
      log_error "$test_name - Expected HTTP $expected_status, got $http_code"
      if [[ -s "$response_file" ]]; then
        echo "Response: $(cat "$response_file")"
      fi
    fi
  else
    log_error "$test_name - Curl command failed"
  fi

  rm -f "$response_file"
}

# Validation functions
validate_json_response() {
  local response_file="$1"
  if command -v jq >/dev/null 2>&1; then
    jq empty <"$response_file" 2>/dev/null
    return $?
  else
    # Basic JSON validation without jq
    grep -q '^{.*}$' "$response_file" || grep -q '^\[.*\]$' "$response_file"
    return $?
  fi
}

validate_models_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"object":"list"' "$response_file" \
    && grep -q '"data":\[' "$response_file"
}

validate_transcription_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"text"' "$response_file"
}

validate_embedding_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"data":\[' "$response_file" \
    && grep -q '"embedding":\[' "$response_file"
}

validate_chat_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"choices":\[' "$response_file" \
    && grep -q '"message"' "$response_file"
}

validate_error_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"error"' "$response_file"
}

# Check prerequisites
if [[ ! -f "$AUDIO_FILE" ]]; then
  log_error "Audio test file not found: $AUDIO_FILE"
  exit 1
fi

log_info "Starting integration tests for $WORKER_URL"
log_info "Using audio file: $AUDIO_FILE"
echo

# =============================================================================
# MODELS ENDPOINT TESTS
# =============================================================================

log_info "=== MODELS ENDPOINT TESTS ==="

run_test "Get available models" \
  "curl -X GET '$WORKER_URL/models' -H 'Authorization: Bearer $AUTH_TOKEN'" \
  200 \
  validate_models_response

echo

# =============================================================================
# AUDIO/TRANSCRIPTION TESTS
# =============================================================================

log_info "=== AUDIO TRANSCRIPTION TESTS ==="

run_test "Basic transcription" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=whisper-1'" \
  200 \
  validate_transcription_response

run_test "Transcription with whisper-large-v3-turbo" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=whisper-large-v3-turbo'" \
  200 \
  validate_transcription_response

run_test "Transcription with text response format" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=whisper-1' -F 'response_format=text'" \
  200

run_test "Transcription with verbose_json" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=whisper-large-v3-turbo' -F 'response_format=verbose_json'" \
  200 \
  validate_transcription_response

run_test "Transcription without file (should fail)" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'model=whisper-1'" \
  400 \
  validate_error_response

run_test "Transcription with invalid model (should fail)" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=invalid-model'" \
  400 \
  validate_error_response

echo

# =============================================================================
# AUDIO/TRANSLATION TESTS
# =============================================================================

log_info "=== AUDIO TRANSLATION TESTS ==="

run_test "Basic translation" \
  "curl -X POST '$WORKER_URL/audio/translations' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=whisper-1'" \
  200 \
  validate_transcription_response

run_test "Translation with text response format" \
  "curl -X POST '$WORKER_URL/audio/translations' -H 'Authorization: Bearer $AUTH_TOKEN' -F 'file=@$AUDIO_FILE' -F 'model=whisper-1' -F 'response_format=text'" \
  200

echo

# =============================================================================
# AUDIO/SPEECH TESTS
# =============================================================================

log_info "=== TEXT-TO-SPEECH TESTS ==="

run_test "Basic TTS" \
  "curl -X POST '$WORKER_URL/audio/speech' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"tts-1\",\"input\":\"Hello, world!\",\"voice\":\"alloy\"}'" \
  200

run_test "TTS with different voice" \
  "curl -X POST '$WORKER_URL/audio/speech' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"tts-1\",\"input\":\"Test message\",\"voice\":\"echo\"}'" \
  200

run_test "TTS without input (should fail)" \
  "curl -X POST '$WORKER_URL/audio/speech' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"tts-1\",\"voice\":\"alloy\"}'" \
  400 \
  validate_error_response

run_test "TTS with invalid voice (should fail)" \
  "curl -X POST '$WORKER_URL/audio/speech' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"tts-1\",\"input\":\"Test\",\"voice\":\"invalid\"}'" \
  400 \
  validate_error_response

echo

# =============================================================================
# EMBEDDINGS TESTS
# =============================================================================

log_info "=== EMBEDDINGS TESTS ==="

run_test "Single text embedding" \
  "curl -X POST '$WORKER_URL/embeddings' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"input\":\"Hello, world!\",\"model\":\"@cf/baai/bge-base-en-v1.5\"}'" \
  200 \
  validate_embedding_response

run_test "Batch embeddings" \
  "curl -X POST '$WORKER_URL/embeddings' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"input\":[\"Hello\",\"World\"],\"model\":\"text-embedding-ada-002\"}'" \
  200 \
  validate_embedding_response

run_test "Embeddings without input (should fail)" \
  "curl -X POST '$WORKER_URL/embeddings' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"text-embedding-ada-002\"}'" \
  400 \
  validate_error_response

echo

# =============================================================================
# CHAT COMPLETION TESTS
# =============================================================================

log_info "=== CHAT COMPLETION TESTS ==="

run_test "Basic chat completion" \
  "curl -X POST '$WORKER_URL/chat/completions' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"@cf/meta/llama-3-8b-instruct\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello!\"}]}'" \
  200 \
  validate_chat_response

run_test "Chat with system message" \
  "curl -X POST '$WORKER_URL/chat/completions' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"gpt-3.5-turbo\",\"messages\":[{\"role\":\"system\",\"content\":\"You are helpful\"},{\"role\":\"user\",\"content\":\"Hi\"}]}'" \
  200 \
  validate_chat_response

run_test "Chat without messages (should fail)" \
  "curl -X POST '$WORKER_URL/chat/completions' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"gpt-3.5-turbo\"}'" \
  400 \
  validate_error_response

echo

# =============================================================================
# COMPLETION TESTS
# =============================================================================

log_info "=== COMPLETION TESTS ==="

run_test "Basic completion" \
  "curl -X POST '$WORKER_URL/completions' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d '{\"model\":\"@cf/qwen/qwen1.5-0.5b-chat\",\"prompt\":\"Hello\"}'" \
  200 \
  validate_chat_response

echo

# =============================================================================
# AUTHENTICATION TESTS
# =============================================================================

log_info "=== AUTHENTICATION TESTS ==="

run_test "Request without auth token (should fail)" \
  "curl -X GET '$WORKER_URL/models'" \
  401 \
  validate_error_response

run_test "Request with invalid auth token (should fail)" \
  "curl -X GET '$WORKER_URL/models' -H 'Authorization: Bearer invalid-token'" \
  403 \
  validate_error_response

echo

# =============================================================================
# ERROR HANDLING TESTS
# =============================================================================

log_info "=== ERROR HANDLING TESTS ==="

run_test "Invalid endpoint (should fail)" \
  "curl -X GET '$WORKER_URL/invalid-endpoint' -H 'Authorization: Bearer $AUTH_TOKEN'" \
  404

run_test "Invalid JSON payload (should fail)" \
  "curl -X POST '$WORKER_URL/chat/completions' -H 'Authorization: Bearer $AUTH_TOKEN' -H 'Content-Type: application/json' -d 'invalid-json'" \
  400

echo

# =============================================================================
# RAG TESTS
# =============================================================================

# RAG Validation functions (copied from test_rag.sh)
validate_store_document_response() {
    local response_file="$1"
    validate_json_response "$response_file" && \
    grep -q '"success":true' "$response_file" && \
    grep -q '"document_id"' "$response_file"
}

validate_rag_search_response() {
    local response_file="$1"
    validate_json_response "$response_file" && \
    grep -q '"query"' "$response_file" && \
    (grep -q '"context"' "$response_file" || grep -q '"sources"' "$response_file")
}

validate_rag_chat_response() {
    local response_file="$1"
    validate_json_response "$response_file" && \
    grep -q '"choices":\[' "$response_file" && \
    (grep -q '"message"' "$response_file" || grep -q '"delta"' "$response_file")
}

validate_vectorize_error_response() {
    local response_file="$1"
    validate_json_response "$response_file" && \
    (grep -q '"error"' "$response_file" || grep -q 'VECTOR_INDEX' "$response_file" || grep -q 'binding' "$response_file")
}

log_info "=== RAG DOCUMENT STORAGE TESTS ==="

run_test "Store document with valid text and metadata" \
'curl -X POST "$WORKER_URL/rag/documents" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "text": "The quick brown fox jumps over the lazy dog. This is a sample document for testing RAG functionality.",
    "metadata": {
        "docId": "test-doc-1",
        "title": "Test Document",
        "category": "sample"
    },
    "chunkSize": 100,
    "chunkOverlap": 20
}'''" \
200 \
validate_store_document_response

sleep 1

run_test "Store document without required docId (should fail)" \
'curl -X POST "$WORKER_URL/rag/documents" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "text": "This document is missing the required docId in metadata.",
    "metadata": {
        "title": "Incomplete Document"
    }
}'''" \
400 \
validate_error_response

sleep 1

run_test "Store document without text (should fail)" \
'curl -X POST "$WORKER_URL/rag/documents" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "metadata": {
        "docId": "missing-text-doc"
    }
}'''" \
400 \
validate_error_response

sleep 1

run_test "Store document without auth (should fail)" \
'curl -X POST "$WORKER_URL/rag/documents" -H "Content-Type: application/json" -d '''{
    "text": "Unauthorized document storage attempt.",
    "metadata": {
        "docId": "unauthorized-doc"
    }
}'''" \
401 \
validate_error_response

echo

log_info "=== RAG SEARCH TESTS ==="

run_test "RAG search with valid query" \
'curl -X POST "$WORKER_URL/rag/search" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "query": "What is RAG functionality?",
    "top_k": 3,
    "score_threshold": 0.5
}'''" \
200 \
validate_rag_search_response

sleep 1

run_test "RAG search without query (should fail)" \
'curl -X POST "$WORKER_URL/rag/search" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "top_k": 3
}'''" \
400 \
validate_error_response

sleep 1

run_test "RAG search without auth (should fail)" \
'curl -X POST "$WORKER_URL/rag/search" -H "Content-Type: application/json" -d '''{
    "query": "Test query"
}'''" \
401 \
validate_error_response

echo

log_info "=== RAG CHAT TESTS ==="

run_test "RAG chat with valid messages" \
'curl -X POST "$WORKER_URL/rag/chat" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "messages": [
        {
            "role": "user",
            "content": "Explain what RAG is based on the stored documents."
        }
    ],
    "rag_top_k": 2
}'''" \
200 \
validate_rag_chat_response

sleep 1

run_test "RAG chat without messages (should fail)" \
'curl -X POST "$WORKER_URL/rag/chat" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "rag_top_k": 2
}'''" \
400 \
validate_error_response

sleep 1

run_test "RAG chat with empty messages array (should fail)" \
'curl -X POST "$WORKER_URL/rag/chat" -H "Content-Type: application/json" -H "Authorization: Bearer '$AUTH_TOKEN'" -d '''{
    "messages": [],
    "rag_top_k": 2
}'''" \
400 \
validate_error_response

sleep 1

run_test "RAG chat without auth (should fail)" \
'curl -X POST "$WORKER_URL/rag/chat" -H "Content-Type: application/json" -d '''{
    "messages": [
        {
            "role": "user",
            "content": "Test query"
        }
    ]
}'''" \
401 \
validate_error_response

echo

# =============================================================================
# FUNCTION CALLING TESTS
# =============================================================================

# Function Calling Validation function
validate_function_call_response() {
  local response_file="$1"
  validate_json_response "$response_file" && \
  grep -q '"tool_calls":\[' "$response_file" && \
  grep -q '"function":{' "$response_file" && \
  grep -q '"name":"calculator"' "$response_file"
}

log_info "=== FUNCTION CALLING TESTS ==="

run_test "Chat completion with function call" \
  "curl -X POST '$WORKER_URL/chat/completions' \
  -H 'Authorization: Bearer $AUTH_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{ \
    "model":"@cf/meta/llama-3-8b-instruct", \
    "messages":[ \
      {"role":"user","content":"What is 2 + 2?"} \
    ], \
    "tools":[ \
      { \
        "type":"function", \
        "function":{ \
          "name":"calculator", \
          "description":"A simple calculator function", \
          "parameters":{ \
            "type":"object", \
            "properties":{ \
              "expression":{"type":"string","description":"The mathematical expression to evaluate"} \
            }, \
            "required":["expression"] \
          } \
        } \
      } \
    ] \
  }'" \
  200 \
  validate_function_call_response

echo

# =============================================================================
# SUMMARY
# =============================================================================

log_info "=== TEST SUMMARY ==="
echo "Tests run: $TESTS_RUN"
echo -e "Tests passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests failed: ${RED}$TESTS_FAILED${NC}"

if [[ $TESTS_FAILED -eq 0 ]]; then
  echo -e "\n${GREEN}🎉 All tests passed!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Some tests failed.${NC}"
  exit 1
fi
