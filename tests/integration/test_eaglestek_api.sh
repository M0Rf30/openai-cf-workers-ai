#!/bin/bash

WORKER_URL="https://ai.eaglestek-informatica.workers.dev"
AUTH_TOKEN="01341be598a3ecd5e15d5dca917c87b963e0121858e7e9f8b6a265a8fe600f92"
AUDIO_FILE="audio.wav"

echo "Testing Eaglestek Audio API..."
echo "=============================="

echo "1. Testing models endpoint..."
curl -s -X GET "$WORKER_URL/v1/models" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" | jq '.'

echo -e "\n2. Testing transcription..."
curl -s -X POST "$WORKER_URL/v1/audio/transcriptions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@$AUDIO_FILE" \
  -F "model=@cf/openai/whisper" | jq '.' | jq '.'

echo -e "\n3. Testing translation..."
curl -s -X POST "$WORKER_URL/v1/audio/translations" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@$AUDIO_FILE" \
  -F "model=@cf/openai/whisper" | jq '.' | jq '.'

echo -e "\n4. Testing TTS..."
curl -s -X POST "$WORKER_URL/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{
    "model": "@cf/myshell-ai/melotts",
    "input": "Hello world from Eaglestek API",
    "voice": "alloy"
  }' \
  --output test_speech.wav

if [ -f "test_speech.wav" ]; then
    echo "TTS output saved to test_speech.wav"
else
    echo "TTS test failed - no output file created"
fi

echo -e "\nAll tests completed!"
