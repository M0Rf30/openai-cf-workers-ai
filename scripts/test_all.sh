#!/bin/bash

# Main test runner for all Cloudflare Workers AI API endpoints
# Runs all individual test scripts in sequence

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

log_header() {
  echo -e "\n${YELLOW}=============================================================================${NC}"
  echo -e "${YELLOW}$1${NC}"
  echo -e "${YELLOW}=============================================================================${NC}\n"
}

cleanup() {
  log_info "Cleaning up..."
  if [ -f worker.pid ]; then
    log_info "Stopping worker process (PID from worker.pid)..."
    kill "$(cat worker.pid)" &>/dev/null
    rm worker.pid
  elif [ -n "$WORKER_PID" ]; then
    log_info "Stopping worker process (PID: $WORKER_PID)..."
    pkill -P "$WORKER_PID" &>/dev/null
    kill "$WORKER_PID" &>/dev/null
  fi
  if [ -f .dev.vars ]; then
    log_info "Removing .dev.vars file..."
    rm .dev.vars
  fi
}

trap cleanup EXIT

run_test_suite() {
  local suite_name="$1"
  local script_name="$2"

  ((TOTAL_TEST_SUITES++))
  log_header "RUNNING TEST SUITE: $suite_name"

  # Export environment variables
  export WORKER_URL
  export AUTH_TOKEN

  # Run the test script
  if timeout 300 bash "$script_name"; then
    log_success "Test suite '$suite_name' completed successfully"
  else
    log_error "Test suite '$suite_name' failed"
  fi

  # Add delay between test suites to help with rate limiting
  echo -e "${BLUE}[INFO]${NC} Waiting 5 seconds before next test suite..."
  sleep 5

  echo
}

log_info "Starting comprehensive test suite for Cloudflare Workers AI API"
log_info "Testing endpoint: $WORKER_URL"
echo

# Start the worker in the background
log_info "Starting worker in the background..."
echo "ACCESS_TOKEN=$AUTH_TOKEN" >.dev.vars
npm run dev >worker.log 2>&1 &
WORKER_PID=$!
echo $WORKER_PID >worker.pid

log_info "Worker starting with PID: $WORKER_PID. Waiting for it to be ready..."

# Wait for the server to be ready
MAX_RETRIES=12
RETRY_COUNT=0
# Check if the endpoint is ready
until curl -s --fail -H "Authorization: Bearer $AUTH_TOKEN" "${WORKER_URL}/models" >/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    log_error "Worker failed to start. Check worker.log for details."
    cat worker.log
    exit 1
  fi
  log_info "Worker not ready yet. Retrying in 5 seconds... ($RETRY_COUNT/$MAX_RETRIES)"
  sleep 5
done

log_success "Worker is up and running."

# Make all test scripts executable
chmod +x scripts/test_*.sh

# Run all test suites
run_test_suite "Function Calling Tests" "scripts/test_function_calls.sh"
run_test_suite "Models Endpoint Tests" "scripts/test_models.sh"
run_test_suite "Embeddings Endpoint Tests" "scripts/test_embeddings.sh"
run_test_suite "Completions Endpoint Tests" "scripts/test_completions.sh"
run_test_suite "Audio Endpoints Tests" "scripts/test_audio.sh"
run_test_suite "Image Generation Tests" "scripts/test_images.sh"
run_test_suite "RAG Endpoint Tests" "scripts/test_rag.sh"

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
