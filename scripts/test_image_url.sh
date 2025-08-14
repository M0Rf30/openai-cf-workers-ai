#!/bin/bash

echo "Running test_image_url.sh..."

curl -X POST http://localhost:8787/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b" \
-d '{ "model": "@cf/meta/llama-4-scout-17b-16e-instruct", "messages": [ { "role": "user", "content": [ { "type": "text", "text": "What is in this image?" }, { "type": "image_url", "image_url": { "url": "https://picsum.photos/200/300" } } ] } ] }'
