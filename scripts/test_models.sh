#!/bin/bash

# Simple test script for models endpoint
# Tests the /v1/models endpoint

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"

echo "Testing models endpoint at $WORKER_URL"

# Test models listing
echo "Testing models listing..."
curl -X GET "$WORKER_URL/models" \
  -H "Authorization: Bearer $AUTH_TOKEN"

echo -e "\nAll models tests completed!"