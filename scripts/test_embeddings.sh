#!/bin/bash

# Test script for Cloudflare Workers AI API - Embeddings Endpoint
# Tests the http://localhost:8787/v1/embeddings endpoint

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"

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
  local json_payload="$2"
  local expected_status="${3:-200}"
  local validation_func="$4"
  local use_auth="${5:-true}"

  ((TESTS_RUN++))
  log_info "Running test: $test_name"

  # Create a temporary file for the JSON payload
  local payload_file=$(mktemp)
  echo "$json_payload" >"$payload_file"

  # Build curl command
  local curl_cmd="curl -X POST \"$WORKER_URL/embeddings\" -H \"Content-Type: application/json\""

  # Add auth header if needed
  if [[ "$use_auth" == "true" ]]; then
    curl_cmd="$curl_cmd -H \"Authorization: Bearer $AUTH_TOKEN\""
  fi

  # Add payload
  curl_cmd="$curl_cmd -d \"@$payload_file\""

  # Run the curl command and capture response
  local response_file=$(mktemp)
  local http_code

  if http_code=$(eval "$curl_cmd -w '%{http_code}' -s -o '$response_file'"); then
    if [[ "$http_code" == "$expected_status" ]]; then
      if [[ -n "$validation_func" ]]; then
        if $validation_func "$response_file"; then
          log_success "$test_name (HTTP $http_code)"
        else
          log_error "$test_name - Validation failed"
          if [[ -s "$response_file" ]]; then
            echo "Response: $(cat "$response_file" | jq . 2>/dev/null || cat "$response_file")"
          fi
        fi
      else
        log_success "$test_name (HTTP $http_code)"
      fi
    else
      log_error "$test_name - Expected HTTP $expected_status, got $http_code"
      if [[ -s "$response_file" ]]; then
        echo "Response: $(cat "$response_file" | jq . 2>/dev/null || cat "$response_file")"
      fi
    fi
  else
    log_error "$test_name - Curl command failed"
    echo "Command: $curl_cmd"
  fi

  # Clean up temporary files
  rm -f "$payload_file" "$response_file"
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

validate_embedding_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"data":\[' "$response_file" \
    && grep -q '"embedding":\[' "$response_file"
}

validate_error_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"error"' "$response_file"
}

log_info "Starting embeddings endpoint tests for $WORKER_URL"
echo

# =============================================================================
# EMBEDDINGS ENDPOINT TESTS
# =============================================================================

log_info "=== EMBEDDINGS ENDPOINT TESTS ==="

run_test "Single text embedding" \
  '{
    "input": "Hello, world!",
    "model": "@cf/baai/bge-base-en-v1.5"
}' \
  200 \
  validate_embedding_response \
  true

run_test "Batch embeddings" \
  '{
    "input": ["Hello", "World"],
    "model": "@cf/baai/bge-base-en-v1.5"
}' \
  200 \
  validate_embedding_response \
  true

run_test "Embeddings without input (should fail)" \
  '{
    "model": "@cf/baai/bge-base-en-v1.5"
}' \
  400 \
  validate_error_response \
  true

run_test "Embeddings with invalid model (should fail)" \
  '{
    "input": "Hello, world!",
    "model": "invalid-model"
}' \
  400 \
  validate_error_response \
  true

run_test "Embeddings without auth (should fail)" \
  '{
    "input": "Hello, world!",
    "model": "@cf/baai/bge-base-en-v1.5"
}' \
  401 \
  validate_error_response \
  false

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
