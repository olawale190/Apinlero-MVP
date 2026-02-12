#!/bin/bash
set -e

echo "🔒 Setting up Layer 4: AI/LLM Observability"
echo "==========================================="

echo ""
echo "📦 Installing AI observability packages..."
npm install @helicone/helpers langfuse langfuse-vercel @langfuse/openai

echo ""
echo "✅ Packages installed"
echo ""
echo "📊 Helicone Configuration"
echo "------------------------"
echo "Required environment variable:"
echo "  HELICONE_API_KEY=sk-helicone-your-key"
echo ""
echo "To get your API key:"
echo "1. Sign up at https://helicone.ai"
echo "2. Navigate to Settings → API Keys"
echo "3. Create a new API key"
echo ""
echo "Update your OpenAI/Anthropic client configuration:"
echo ""
echo "For OpenAI:"
echo "  const openai = new OpenAI({"
echo "    apiKey: process.env.OPENAI_API_KEY,"
echo "    baseURL: 'https://oai.helicone.ai/v1',"
echo "    defaultHeaders: {"
echo "      'Helicone-Auth': \`Bearer \${process.env.HELICONE_API_KEY}\`,"
echo "    },"
echo "  });"
echo ""
echo "For Anthropic:"
echo "  const anthropic = new Anthropic({"
echo "    apiKey: process.env.ANTHROPIC_API_KEY,"
echo "    baseURL: 'https://anthropic.helicone.ai',"
echo "    defaultHeaders: {"
echo "      'Helicone-Auth': \`Bearer \${process.env.HELICONE_API_KEY}\`,"
echo "    },"
echo "  });"
echo ""

echo "📊 Langfuse Configuration"
echo "------------------------"
echo "Required environment variables:"
echo "  LANGFUSE_SECRET_KEY=sk-lf-..."
echo "  LANGFUSE_PUBLIC_KEY=pk-lf-..."
echo "  LANGFUSE_BASEURL=https://cloud.langfuse.com"
echo ""
echo "To get these values:"
echo "1. Sign up at https://cloud.langfuse.com"
echo "2. Create a new project"
echo "3. Copy the API keys from Settings"
echo ""
echo "Wrap your OpenAI client:"
echo "  import { observeOpenAI } from '@langfuse/openai';"
echo "  const openai = observeOpenAI(new OpenAI());"
echo ""

# Update .env.local if it exists
if [ -f ".env.local" ]; then
    if ! grep -q "HELICONE_API_KEY" .env.local; then
        echo "" >> .env.local
        echo "# AI/LLM Observability" >> .env.local
        echo "HELICONE_API_KEY=" >> .env.local
        echo "LANGFUSE_SECRET_KEY=" >> .env.local
        echo "LANGFUSE_PUBLIC_KEY=" >> .env.local
        echo "LANGFUSE_BASEURL=https://cloud.langfuse.com" >> .env.local
        echo "✅ Added AI observability variables to .env.local"
    fi
fi

echo ""
echo "✅ Layer 4 setup complete!"
echo ""
echo "Next steps:"
echo "1. Get API keys from Helicone and Langfuse"
echo "2. Add environment variables to .env.local and Railway"
echo "3. Update your AI client configuration to use the proxy URLs"
echo "4. Make a test LLM call and verify it appears in dashboards"
