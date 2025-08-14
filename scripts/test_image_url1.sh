curl -X POST https://ai.morf3089.workers.dev/v1/chat/completions \
-H "Content-Type: application/json" \
-H "Authorization: Bearer 92172267ccffe5a5d18d7a661924f16830c2d0130a4165451c15d34e773a5b4b" \
-d '{ "model": "@cf/meta/llama-4-scout-17b-16e-instruct", "messages": [ { "role": "user", "content": [ { "type": "text", "text": "What is in this image?" }, { "type": "image_url", "image_url": { "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/1280px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg" } } ] } ] }'
