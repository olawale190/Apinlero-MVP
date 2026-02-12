# Àpínlẹ̀rọ 4-Layer Security - Quick Start Guide

## 🚀 Quick Setup

```bash
cd project
npm run security:setup
```

This will set up all 4 security layers automatically.

## 📋 Individual Layer Setup

```bash
# Layer 1: Secret Scanning & Code Security
npm run security:layer1

# Layer 2: Container Vulnerability Scanning
npm run security:layer2

# Layer 3: Runtime Monitoring & Error Tracking
npm run security:layer3

# Layer 4: AI/LLM Observability
npm run security:layer4
```

## 🔑 Required Environment Variables

Copy from [.env.security.example](project/.env.security.example) to your `.env.local`:

```env
# Layer 1
SNYK_TOKEN=

# Layer 3
VITE_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Layer 4
HELICONE_API_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

## 🔍 Security Scans

```bash
# Generate SBOM (Software Bill of Materials)
npm run security:sbom

# Scan for vulnerabilities
npm run security:scan

# Run Snyk tests
npm run security:snyk
```

## ✅ GitHub Repository Settings

After setup, enable these in your GitHub repository:

1. Go to: **Settings → Code security and analysis**
2. Enable:
   - ✅ Secret scanning
   - ✅ Push protection
   - ✅ Code scanning (CodeQL)
3. Add repository secret:
   - Name: `SNYK_TOKEN`
   - Value: Your Snyk API token

## 🔗 Get API Keys

| Service | Where to Get | What For |
|---------|--------------|----------|
| [Snyk](https://app.snyk.io/account) | Account Settings → API Token | Dependency scanning |
| [Sentry](https://sentry.io) | Project Settings → Client Keys | Error tracking |
| [Helicone](https://helicone.ai) | Settings → API Keys | LLM cost tracking |
| [Langfuse](https://cloud.langfuse.com) | Settings → API Keys | LLM tracing |

## 🎯 Verification Tests

After setup, verify each layer works:

### Layer 1 - Secret Scanning
```bash
# This should be blocked by GitHub push protection
echo "STRIPE_SECRET_KEY=sk_live_fake123" > test-secret.txt
git add test-secret.txt
git commit -m "test"
# Should fail with secret detection warning
```

### Layer 2 - Vulnerability Scanning
```bash
npm run security:scan
# Should show vulnerability report
```

### Layer 3 - Error Tracking
Trigger a test error in your app and check Sentry dashboard

### Layer 4 - LLM Observability
Make an LLM call and verify it appears in Helicone/Langfuse dashboards

## 💰 Cost: £0/month

All tools use free tiers:
- GitHub Security: Unlimited
- Snyk: 200 tests/month
- Grype/Syft: Open-source (unlimited)
- Sentry: 5K errors/month
- Uptime Kuma: Self-hosted (unlimited)
- Helicone: 10K requests/month
- Langfuse: 50K events/month

## 📚 Full Documentation

See [SECURITY.md](SECURITY.md) for complete documentation.

## 🆘 Troubleshooting

### Snyk authentication fails
```bash
snyk auth
# This will open your browser for authentication
```

### Grype/Syft not found
```bash
# macOS
brew install grype syft

# Linux
npm run security:layer2
```

### Sentry not tracking errors
Check that `VITE_SENTRY_DSN` is set in `.env.local` and Sentry is initialized in your app's entry point.

## 🔄 Regular Maintenance

```bash
# Weekly: Check for new vulnerabilities
npm run security:scan

# Monthly: Review Snyk, Sentry, and LLM observability dashboards
# Monthly: Update dependencies and rescan
```

## 📞 Support

- Issues: Create a GitHub issue
- Security vulnerabilities: See [SECURITY.md](SECURITY.md)
