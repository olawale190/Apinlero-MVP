#!/bin/bash
set -e

echo "🔒 Setting up Layer 2: Container Vulnerability Scanning"
echo "========================================================"

# Detect OS
OS="$(uname -s)"

# Check if Grype is installed
if ! command -v grype &> /dev/null; then
    echo "📦 Installing Grype..."
    if [[ "$OS" == "Darwin" ]]; then
        if command -v brew &> /dev/null; then
            brew install grype
        else
            curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
        fi
    else
        curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
    fi
else
    echo "✅ Grype already installed"
fi

# Check if Syft is installed
if ! command -v syft &> /dev/null; then
    echo "📦 Installing Syft..."
    if [[ "$OS" == "Darwin" ]]; then
        if command -v brew &> /dev/null; then
            brew install syft
        else
            curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
        fi
    else
        curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
    fi
else
    echo "✅ Syft already installed"
fi

echo ""
echo "📊 Generating Software Bill of Materials (SBOM)..."
syft dir:. -o json > sbom.json
echo "✅ SBOM saved to sbom.json"

echo ""
echo "🔍 Scanning for vulnerabilities..."
grype sbom:sbom.json --only-fixed --fail-on high -o table || echo "⚠️  High severity vulnerabilities found. Review the report above."

echo ""
echo "✅ Layer 2 setup complete!"
echo ""
echo "The Grype GitHub workflow is already configured in .github/workflows/grype.yml"
echo "It will run automatically on every push and pull request."
