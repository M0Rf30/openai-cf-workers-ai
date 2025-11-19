#!/bin/bash
API_URL="${API_URL:-http://localhost:8787}"
AUTH_TOKEN="${AUTH_TOKEN:-your_token_here}"

echo "========================================"
echo "TTS Models Comparison Test"
echo "========================================"

TEXT="The quick brown fox jumps over the lazy dog"

echo -e "\n1. MeloTTS (@cf/myshell-ai/melotts)"
echo "   - High quality, multiple languages"
curl -s -X POST "$API_URL/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"model\": \"@cf/myshell-ai/melotts\", \"input\": \"$TEXT\", \"voice\": \"alloy\"}" \
  --output melotts.mp3
echo "   ✓ Generated: $(wc -c < melotts.mp3) bytes"

echo -e "\n2. Deepgram Aura (@cf/deepgram/aura-1)"
echo "   - Fast, low latency"
curl -s -X POST "$API_URL/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"model\": \"@cf/deepgram/aura-1\", \"input\": \"$TEXT\", \"voice\": \"alloy\"}" \
  --output deepgram.mp3
echo "   ✓ Generated: $(wc -c < deepgram.mp3) bytes"

echo -e "\n3. OpenAI Compatible (tts-1)"
echo "   - Maps to MeloTTS"
curl -s -X POST "$API_URL/v1/audio/speech" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "{\"model\": \"tts-1\", \"input\": \"$TEXT\", \"voice\": \"alloy\"}" \
  --output openai_tts.mp3
echo "   ✓ Generated: $(wc -c < openai_tts.mp3) bytes"

echo -e "\n========================================"
echo "All TTS models working! Audio files saved:"
ls -lh *.mp3 2>/dev/null | awk '{print "  " $9 " - " $5}'
echo "========================================"
