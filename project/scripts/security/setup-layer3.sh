#!/bin/bash
set -e

echo "🔒 Setting up Layer 3: Runtime Monitoring & Error Tracking"
echo "==========================================================="

echo ""
echo "📊 Sentry Configuration"
echo "----------------------"
echo "Sentry is already configured in src/lib/sentry.ts"
echo ""
echo "Required environment variables:"
echo "  VITE_SENTRY_DSN=https://your-key@ingest.sentry.io/project-id"
echo "  SENTRY_AUTH_TOKEN=sntrys_your-token"
echo ""
echo "To get these values:"
echo "1. Sign up at https://sentry.io"
echo "2. Create a new React project"
echo "3. Copy the DSN from the project settings"
echo "4. Generate an auth token from Settings → Account → API → Auth Tokens"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  .env.local not found. Creating template..."
    cat > .env.local << 'EOF'
# Sentry Configuration
VITE_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Add other environment variables here
EOF
    echo "✅ Created .env.local template"
else
    echo "✅ .env.local exists"
fi

echo ""
echo "📊 Uptime Kuma Setup"
echo "-------------------"
echo "Uptime Kuma should be deployed separately for monitoring."
echo ""
echo "Deployment options:"
echo "1. Railway: Deploy using Uptime Kuma template"
echo "2. Docker: docker run -d -p 3001:3001 louislam/uptime-kuma:1"
echo ""
echo "Recommended monitors to add:"
echo "  - Àpínlẹ̀rọ Web (HTTP)"
echo "  - Supabase API (HTTP)"
echo "  - Neo4j (TCP Port 7687)"
echo "  - n8n (HTTP)"
echo "  - WhatsApp Webhook (HTTP)"
echo ""

echo "✅ Layer 3 setup complete!"
echo ""
echo "Next steps:"
echo "1. Add Sentry environment variables to .env.local and Railway"
echo "2. Deploy Uptime Kuma on Railway"
echo "3. Configure monitors in Uptime Kuma dashboard"
echo "4. Set up notification channels (Slack, Email, etc.)"
