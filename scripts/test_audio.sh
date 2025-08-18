#!/bin/bash

# Simple test script for audio endpoints
# Tests the /v1/audio/* endpoints

WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-change_this_token}"
AUDIO_FILE="${AUDIO_FILE:-$(pwd)/tests/fixtures/test_speech.wav}"

echo "Testing audio endpoints at $WORKER_URL"

# Test basic transcription
echo "Testing transcription..."
curl -X POST "$WORKER_URL/audio/transcriptions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@$AUDIO_FILE" \
  -F "model=whisper-1"

echo -e "\nTesting TTS..."
curl -X POST "$WORKER_URL/audio/speech" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"tts-1","input":"Hello, world!","voice":"alloy"}' \
  -o /tmp/test_speech.mp3

echo -e "\nAll audio tests completed!"
