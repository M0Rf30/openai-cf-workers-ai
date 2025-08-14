#!/bin/bash

# Test script for Cloudflare Workers AI API - RAG Endpoints
# 
# IMPORTANT: This script requires:
# 1. The worker to be running locally first: npm run dev
# 2. Vectorize index to be properly configured in wrangler.toml
# 3. Proper environment variables set in .dev.vars
# 
# The script tests the /v1/rag endpoints

# Configuration
WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-sk-1234567890ASDFGHJKLQWERTYUIOP}"

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

# Environment check
if ! command -v curl >/dev/null 2>&1; then
    echo "Error: curl is required but not installed."
    exit 1
fi

# Test if the worker is running
log_info "Testing connection to $WORKER_URL..."
if ! curl -s --connect-timeout 5 "$WORKER_URL/models" >/dev/null 2>&1; then
    log_error "Cannot connect to worker at $WORKER_URL"
    log_info "Make sure the worker is running locally with: npm run dev"
    exit 1
fi
log_success "Worker connection test passed"

run_test() {
    local test_name="$1"
    local json_payload="$2"
    local expected_status="${3:-200}"
    local validation_func="$4"
    local use_auth="${5:-true}"
    local endpoint="$6"
    
    ((TESTS_RUN++))
    log_info "Running test: $test_name"
    
    # Create a temporary file for the JSON payload
    local payload_file=$(mktemp)
    echo "$json_payload" > "$payload_file"
    
    # Build curl command
    local curl_cmd="curl -X POST \"$WORKER_URL/rag/$endpoint\" -H \"Content-Type: application/json\""
    
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
    
    # Add delay to help with rate limiting
    sleep 1
}

# Validation functions
validate_json_response() {
    local response_file="$1"
    if command -v jq >/dev/null 2>&1; then
        jq empty < "$response_file" 2>/dev/null
        return $?
    else
        # Basic JSON validation without jq
        grep -q '^{.*}$' "$response_file" || grep -q '^\[.*\]$' "$response_file"
        return $?
    fi
}

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

validate_error_response() {
    local response_file="$1"
    validate_json_response "$response_file" && \
    grep -q '"error"' "$response_file"
}

validate_vectorize_error_response() {
    local response_file="$1"
    validate_json_response "$response_file" && \
    (grep -q '"error"' "$response_file" || grep -q 'VECTOR_INDEX' "$response_file" || grep -q 'binding' "$response_file")
}

log_info "Starting RAG endpoint tests for $WORKER_URL"
echo

# =============================================================================
# RAG DOCUMENT STORAGE TESTS
# =============================================================================

log_info "=== RAG DOCUMENT STORAGE TESTS ==="

# First, test if Vectorize is properly configured
run_test "Store document with valid text and metadata" \
'{
    "text": "The quick brown fox jumps over the lazy dog. This is a sample document for testing RAG functionality.",
    "metadata": {
        "docId": "test-doc-1",
        "title": "Test Document",
        "category": "sample"
    },
    "chunkSize": 100,
    "chunkOverlap": 20
}' \
200 \
validate_store_document_response \
true \
"documents"

# Check if we got a 500 error due to missing Vectorize
if [[ $TESTS_FAILED -gt 0 ]]; then
    log_warning "If you're getting 500 errors, it's likely because Vectorize is not configured."
    log_info "To fix this:"
    log_info "1. Uncomment the [[vectorize]] section in wrangler.toml"
    log_info "2. Create a Vectorize index: wrangler vectorize create openai-cf-embeddings --dimensions=768"
    log_info "3. Update the index_name in wrangler.toml if needed"
    echo
fi

run_test "Store document without required docId (should fail)" \
'{
    "text": "This document is missing the required docId in metadata.",
    "metadata": {
        "title": "Incomplete Document"
    }
}' \
400 \
validate_error_response \
true \
"documents"

run_test "Store document without text (should fail)" \
'{
    "metadata": {
        "docId": "missing-text-doc"
    }
}' \
400 \
validate_error_response \
true \
"documents"

run_test "Store document without auth (should fail)" \
'{
    "text": "Unauthorized document storage attempt.",
    "metadata": {
        "docId": "unauthorized-doc"
    }
}' \
401 \
validate_error_response \
false \
"documents"

echo

# =============================================================================
# RAG SEARCH TESTS
# =============================================================================

log_info "=== RAG SEARCH TESTS ==="

run_test "RAG search with valid query" \
'{
    "query": "What is RAG functionality?",
    "top_k": 3,
    "score_threshold": 0.5
}' \
200 \
validate_rag_search_response \
true \
"search"

run_test "RAG search without query (should fail)" \
'{
    "top_k": 3
}' \
400 \
validate_error_response \
true \
"search"

run_test "RAG search without auth (should fail)" \
'{
    "query": "Test query"
}' \
401 \
validate_error_response \
false \
"search"

echo

# =============================================================================
# RAG CHAT TESTS
# =============================================================================

log_info "=== RAG CHAT TESTS ==="

run_test "RAG chat with valid messages" \
'{
    "messages": [
        {
            "role": "user",
            "content": "Explain what RAG is based on the stored documents."
        }
    ],
    "rag_top_k": 2
}' \
200 \
validate_rag_chat_response \
true \
"chat"

run_test "RAG chat without messages (should fail)" \
'{
    "rag_top_k": 2
}' \
400 \
validate_error_response \
true \
"chat"

run_test "RAG chat with empty messages array (should fail)" \
'{
    "messages": [],
    "rag_top_k": 2
}' \
400 \
validate_error_response \
true \
"chat"

run_test "RAG chat without auth (should fail)" \
'{
    "messages": [
        {
            "role": "user",
            "content": "Test query"
        }
    ]
}' \
401 \
validate_error_response \
false \
"chat"

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
    if [[ $TESTS_FAILED -gt $TESTS_PASSED ]]; then
        echo -e "\n${YELLOW}Common issues:${NC}"
        echo "1. Vectorize not configured - check wrangler.toml"
        echo "2. Worker not running - run 'npm run dev'"
        echo "3. Wrong AUTH_TOKEN - check .dev.vars"
        echo "4. Missing bindings - check wrangler.toml bindings section"
    fi
    exit 1
fi