#!/bin/bash

# Setup script for RAG functionality
# This script helps configure the necessary bindings for RAG to work

set -e

echo "🔧 Setting up RAG functionality..."

# Check if wrangler.toml exists
if [[ ! -f "wrangler.toml" ]]; then
    echo "❌ wrangler.toml not found!"
    exit 1
fi

# Check if Vectorize section is commented out
if grep -q "# \[\[vectorize\]\]" wrangler.toml; then
    echo "📝 Enabling Vectorize configuration in wrangler.toml..."
    
    # Uncomment the vectorize section
    sed -i 's/# \[\[vectorize\]\]/[[vectorize]]/g' wrangler.toml
    sed -i 's/# binding = "VECTOR_INDEX"/binding = "VECTOR_INDEX"/g' wrangler.toml
    sed -i 's/# index_name = "openai-cf-embeddings"/index_name = "openai-cf-embeddings"/g' wrangler.toml
    
    echo "✅ Vectorize configuration enabled"
else
    echo "ℹ️  Vectorize already configured or not commented out"
fi

# Check if .dev.vars exists
if [[ ! -f ".dev.vars" ]]; then
    echo "📝 Creating .dev.vars from example..."
    cp .dev.vars.example .dev.vars
    echo "✅ .dev.vars created"
else
    echo "ℹ️  .dev.vars already exists"
fi

echo ""
echo "🚀 Next steps to complete RAG setup:"
echo ""
echo "1. Create Vectorize index (if not already created):"
echo "   wrangler vectorize create openai-cf-embeddings --dimensions=768"
echo ""
echo "2. Update the index ID in wrangler.toml if needed"
echo ""
echo "3. Install dependencies:"
echo "   npm install --legacy-peer-deps"
echo ""
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "5. Run RAG tests:"
echo "   ./test_rag_fixed.sh"
echo ""
echo "📖 For more information, see the RAG documentation in the README."