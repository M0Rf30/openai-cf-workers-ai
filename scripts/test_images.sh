#!/bin/bash

# Test script for Cloudflare Workers AI API - Image Generation Endpoint
# Tests the http://localhost:8787/v1/images/generations endpoint

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

  ((TESTS_RUN++))
  log_info "Running test: $test_name"

  # Create a temporary file for the JSON payload
  local payload_file=$(mktemp)
  echo "$json_payload" >"$payload_file"

  # Run the curl command and capture response
  local response_file=$(mktemp)
  local http_code

  if http_code=$(curl -X POST "$WORKER_URL/images/generations" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    -d "@$payload_file" \
    -w '%{http_code}' -s -o "$response_file"); then

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
  fi

  # Clean up temporary files
  rm -f "$payload_file" "$response_file"

  # Add delay to help with rate limiting
  sleep 2
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

validate_image_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"data":\[' "$response_file"
}

validate_error_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"error"' "$response_file"
}

log_info "Starting image generation endpoint tests for $WORKER_URL"
echo

# =============================================================================
# IMAGE GENERATION ENDPOINT TESTS
# =============================================================================

log_info "=== IMAGE GENERATION ENDPOINT TESTS ==="

run_test "Basic image generation" \
  '{
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "512x512"
}' \
  200 \
  validate_image_response

run_test "Image generation with different size" \
  '{
    "prompt": "A red cube",
    "n": 1,
    "size": "256x256"
}' \
  200 \
  validate_image_response

run_test "Image generation without prompt (should fail)" \
  '{
    "n": 1,
    "size": "512x512"
}' \
  400 \
  validate_error_response

run_test "Image generation with invalid size (should fail)" \
  '{
    "prompt": "A red cube",
    "n": 1,
    "size": "invalid-size"
}' \
  400 \
  validate_error_response

run_test "Image generation without auth (should fail)" \
  '{
    "prompt": "A cute baby sea otter",
    "n": 1,
    "size": "512x512"
}' \
  401 \
  validate_error_response 'curl -X POST "$WORKER_URL/images/generations" -H "Content-Type: application/json" -d'

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
