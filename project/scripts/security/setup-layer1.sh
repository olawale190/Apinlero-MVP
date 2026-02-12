#!/bin/bash
set -e

echo "🔒 Setting up Layer 1: Secret Scanning & Code Security"
echo "=================================================="

# Check if Snyk is installed
if ! command -v snyk &> /dev/null; then
    echo "📦 Installing Snyk CLI..."
    npm install -g snyk
else
    echo "✅ Snyk CLI already installed"
fi

# Check if user is authenticated
echo ""
echo "🔐 Authenticating with Snyk..."
echo "This will open your browser for authentication."
echo "If you're already authenticated, you can skip this step."
read -p "Press Enter to continue or Ctrl+C to cancel..."

snyk auth || echo "⚠️  Snyk authentication skipped or failed. You can run 'snyk auth' later."

echo ""
echo "🔍 Running vulnerability scans..."
echo ""

# Test for vulnerabilities
echo "Testing for dependency vulnerabilities..."
snyk test || echo "⚠️  Vulnerabilities found. Review the report above."

echo ""
echo "Testing source code..."
snyk code test || echo "⚠️  Code issues found. Review the report above."

echo ""
echo "📊 Enabling continuous monitoring..."
snyk monitor || echo "⚠️  Monitor setup failed. Check your Snyk authentication."

echo ""
echo "✅ Layer 1 setup complete!"
echo ""
echo "Next steps:"
echo "1. Go to GitHub repository → Settings → Code security and analysis"
echo "2. Enable: Secret scanning, Push protection, and Code scanning (CodeQL)"
echo "3. Add SNYK_TOKEN to GitHub repository secrets"
echo "   Get your token from: https://app.snyk.io/account"
echo ""
echo "GitHub workflows are already configured in .github/workflows/"
