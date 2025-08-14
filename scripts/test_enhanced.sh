#!/bin/bash

# Enhanced test runner with retry logic for rate limiting
# This script adds longer delays and retry mechanisms to handle rate limiting

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"
MAX_RETRIES=3
RETRY_DELAY=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TEST_SUITES=0
PASSED_TEST_SUITES=0
FAILED_TEST_SUITES=0

# Utility functions
log_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
  echo -e "${GREEN}[PASS]${NC} $1"
  ((PASSED_TEST_SUITES++))
}

log_error() {
  echo -e "${RED}[FAIL]${NC} $1"
  ((FAILED_TEST_SUITES++))
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_header() {
  echo -e "\n${YELLOW}=============================================================================${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${YELLOW}=============================================================================${NC}\n"
}

run_test_suite_with_retry() {
  local suite_name="$1"
  local script_name="$2"
  local retries=0

  ((TOTAL_TEST_SUITES++))
  log_header "RUNNING TEST SUITE: $suite_name"

  # Export environment variables
  export WORKER_URL
  export AUTH_TOKEN

  # Run the test script with retry logic
  while [[ $retries -lt $MAX_RETRIES ]]; do
    if timeout 300 bash "$script_name"; then
      log_success "Test suite '$suite_name' completed successfully"
      return 0
    else
      retries=$((retries + 1))
      if [[ $retries -lt $MAX_RETRIES ]]; then
        log_warning "Test suite '$suite_name' failed. Retrying in $RETRY_DELAY seconds... (Attempt $((retries + 1))/$MAX_RETRIES)"
        sleep $RETRY_DELAY
      fi
    fi
  done

  log_error "Test suite '$suite_name' failed after $MAX_RETRIES attempts"
  return 1
}

log_info "Starting enhanced test suite for Cloudflare Workers AI API"
log_info "Testing endpoint: $WORKER_URL"
log_info "Max retries per test suite: $MAX_RETRIES"
log_info "Delay between retries: ${RETRY_DELAY}s"
echo

# Make all test scripts executable
chmod +x test_*.sh

# Run all test suites with retry logic
run_test_suite_with_retry "Function Calling Tests" "./test_function_calls.sh"
run_test_suite_with_retry "Models Endpoint Tests" "./test_models.sh"
run_test_suite_with_retry "Embeddings Endpoint Tests" "./test_embeddings.sh"
run_test_suite_with_retry "Completions Endpoint Tests" "./test_completions.sh"
run_test_suite_with_retry "Audio Endpoints Tests" "./test_audio.sh"
run_test_suite_with_retry "Image Generation Tests" "./test_images.sh"
run_test_suite_with_retry "RAG Endpoint Tests" "./test_rag.sh"

# =============================================================================
# SUMMARY
# =============================================================================

log_header "FINAL TEST SUMMARY"
echo "Test suites run: $TOTAL_TEST_SUITES"
echo -e "Test suites passed: ${GREEN}$PASSED_TEST_SUITES${NC}"
echo -e "Test suites failed: ${RED}$FAILED_TEST_SUITES${NC}"

if [[ $FAILED_TEST_SUITES -eq 0 ]]; then
  echo -e "\n${GREEN}🎉 All test suites passed!${NC}"
  exit 0
else
  echo -e "\n${RED}❌ Some test suites failed.${NC}"
  exit 1
fi
