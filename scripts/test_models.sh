#!/bin/bash

# Simple test script for models endpoint
# Tests the /v1/models endpoint

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-change_this_token}"

echo "Testing models endpoint at $WORKER_URL"

# Test models listing
echo "Testing models listing..."
curl -X GET "$WORKER_URL/models" \
  -H "Authorization: Bearer $AUTH_TOKEN"

echo -e "\nAll models tests completed!"
