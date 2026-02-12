# Security Setup Skill

Set up comprehensive 4-layer security and observability stack for production applications.

## What this skill does

Implements a complete security infrastructure with:
- **Layer 1:** Secret scanning & code security (GitHub + Snyk)
- **Layer 2:** Container vulnerability scanning (Grype + Syft)
- **Layer 3:** Runtime monitoring & error tracking (Sentry + Uptime Kuma)
- **Layer 4:** AI/LLM observability (Helicone + Langfuse)

All tools use free tiers (£0/month).

## When to use this skill

Use when:
- Setting up security for a new project
- Adding security layers to an existing application
- Need to implement security best practices
- Want to monitor production errors and LLM costs
- Required to comply with security standards

## What this skill creates

### GitHub Workflows
- `.github/workflows/codeql.yml` - Code security analysis
- `.github/workflows/snyk.yml` - Dependency scanning
- `.github/workflows/grype.yml` - Container vulnerability scanning

### Setup Scripts
- `scripts/security/setup-all.sh` - Full 4-layer setup
- `scripts/security/setup-layer1.sh` - Secret scanning & code security
- `scripts/security/setup-layer2.sh` - Container scanning
- `scripts/security/setup-layer3.sh` - Runtime monitoring
- `scripts/security/setup-layer4.sh` - AI/LLM observability

### Documentation
- `SECURITY.md` - Complete security documentation
- `SECURITY_4LAYER_SETUP.md` - Quick start guide
- `SECURITY_SETUP_COMPLETE.md` - Implementation summary
- `.env.security.example` - Security environment variables template

### Package.json Scripts
Adds security commands to run scans and setup

## Example usage

```bash
# Run the skill
/security-setup

# After skill completes, run setup
npm run security:setup

# Or run individual layers
npm run security:layer1
npm run security:layer2
npm run security:layer3
npm run security:layer4

# Run security scans
npm run security:scan
npm run security:snyk
```

## What you need

After running this skill, you'll need to:

1. **Get API keys from:**
   - Snyk (https://app.snyk.io)
   - Sentry (https://sentry.io)
   - Helicone (https://helicone.ai)
   - Langfuse (https://cloud.langfuse.com)

2. **Enable GitHub features:**
   - Secret scanning
   - Push protection
   - Code scanning (CodeQL)

3. **Add environment variables to `.env.local` and hosting platform**

## Total cost

£0/month - All tools use free tiers

## Technologies used

- GitHub Security Features (secret scanning, CodeQL)
- Snyk (dependency & code scanning)
- Grype & Syft (container scanning)
- Sentry (error tracking)
- Uptime Kuma (uptime monitoring)
- Helicone (LLM gateway)
- Langfuse (LLM tracing)
