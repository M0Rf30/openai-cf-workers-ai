#!/bin/bash
# Deploy to Cloudflare Workers
# Usage: ./scripts/deploy.sh

# Load account ID from .dev.vars if it exists
if [ -f .dev.vars ]; then
    export $(grep -v '^#' .dev.vars | xargs)
fi

# Deploy with account ID from environment
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "Error: CLOUDFLARE_ACCOUNT_ID not set"
    echo "Either:"
    echo "  1. Add CLOUDFLARE_ACCOUNT_ID to .dev.vars"
    echo "  2. Export it: export CLOUDFLARE_ACCOUNT_ID=your-account-id"
    exit 1
fi

echo "Deploying to Cloudflare Workers..."
echo "Account ID: $CLOUDFLARE_ACCOUNT_ID"
wrangler deploy
