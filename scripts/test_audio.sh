#!/bin/bash

# Test script for Cloudflare Workers AI API - Audio Endpoints
# Tests the http://localhost:8787/v1/audio/* endpoints

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"
AUDIO_FILE="${AUDIO_FILE:-$(pwd)/tests/fixtures/test_speech.wav}"

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

validate_transcription_response() {
  local response_file="$1"
  validate_json_response "$response_file" \
    && grep -q '"text"' "$response_file"
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

log_info "Starting audio endpoint tests for $WORKER_URL"
log_info "Using audio file: $AUDIO_FILE"
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

run_test "Transcription without auth (should fail)" \
  "curl -X POST '$WORKER_URL/audio/transcriptions' -F 'file=@$AUDIO_FILE' -F 'model=whisper-1'" \
  401 \
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

run_test "Translation without auth (should fail)" \
  "curl -X POST '$WORKER_URL/audio/translations' -F 'file=@$AUDIO_FILE' -F 'model=whisper-1'" \
  401 \
  validate_error_response

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

run_test "TTS without auth (should fail)" \
  "curl -X POST '$WORKER_URL/audio/speech' -H 'Content-Type: application/json' -d '{\"model\":\"tts-1\",\"input\":\"Hello, world!\",\"voice\":\"alloy\"}'" \
  401 \
  validate_error_response

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
