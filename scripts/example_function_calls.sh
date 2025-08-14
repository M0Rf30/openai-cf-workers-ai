#!/bin/bash

# Simple example script demonstrating function calling with the Cloudflare Workers AI API

# Configuration - replace with your actual values
WORKER_URL="${WORKER_URL:-http://localhost:8787/v1}"
AUTH_TOKEN="${AUTH_TOKEN:-92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b}"

echo "=== Cloudflare Workers AI Function Calling Example ==="
echo

# Example 1: Basic function calling
echo "1. Requesting weather information for London:"
echo

curl -X POST "$WORKER_URL/chat/completions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/meta/llama-3.1-8b-instruct-fp8",
    "messages": [
      {"role": "user", "content": "What is the weather like in London?"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_current_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"]
              }
            },
            "required": ["location"]
          }
        }
      }
    ],
    "tool_choice": "auto"
  }' | jq .

echo
echo "=== End of Example 1 ==="
echo

# Example 2: Function calling with multiple tools
echo "2. Requesting weather and time information for Tokyo:"
echo

curl -X POST "$WORKER_URL/chat/completions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/meta/llama-3.1-8b-instruct-fp8",
    "messages": [
      {"role": "user", "content": "What is the weather and time in Tokyo?"}
    ],
    "tools": [
      {
        "type": "function",
        "function": {
          "name": "get_current_weather",
          "description": "Get the current weather in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              },
              "unit": {
                "type": "string",
                "enum": ["celsius", "fahrenheit"]
              }
            },
            "required": ["location"]
          }
        }
      },
      {
        "type": "function",
        "function": {
          "name": "get_current_time",
          "description": "Get the current time in a given location",
          "parameters": {
            "type": "object",
            "properties": {
              "location": {
                "type": "string",
                "description": "The city and state, e.g. San Francisco, CA"
              }
            },
            "required": ["location"]
          }
        }
      }
    ],
    "tool_choice": "auto"
  }' | jq .

echo
echo "=== End of Example 2 ==="
echo

# Example 3: Processing function results
echo "3. Simulating function call results processing:"
echo

curl -X POST "$WORKER_URL/chat/completions" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "@cf/meta/llama-3.1-8b-instruct-fp8",
    "messages": [
      {"role": "user", "content": "What is the weather like in London?"},
      {"role": "assistant", "content": "Function Call: get_current_weather\nArguments: {\"location\": \"London\", \"unit\": \"celsius\"}"},
      {"role": "user", "content": "Function Result for call_1234567890: {\"temperature\": 22, \"unit\": \"celsius\", \"description\": \"Sunny\"}"},
      {"role": "user", "content": "Now that you know the weather is sunny and 22°C in London, what should I wear if I visit?"}
    ]
  }' | jq .

echo
echo "=== End of Example 3 ==="
echo

echo "All examples completed!"
