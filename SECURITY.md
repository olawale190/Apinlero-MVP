# Àpínlẹ̀rọ Security Setup Guide

## Overview
This document outlines the comprehensive 4-layer security and observability stack for Àpínlẹ̀rọ. All tools use free tiers or are open-source.

## Quick Start

```bash
# Run full security setup (all 4 layers)
npm run security:setup

# Run individual layers
npm run security:layer1  # Secret scanning & code security
npm run security:layer2  # Container vulnerability scanning
npm run security:layer3  # Runtime monitoring & error tracking
npm run security:layer4  # AI/LLM observability
```

## Architecture

- **Framework:** Vite + React (Frontend) + Express (Backend)
- **Database:** Supabase + Neo4j
- **Hosting:** Railway (+ Vercel for frontend if applicable)
- **AI:** OpenAI / Anthropic APIs via WhatsApp agent + n8n workflows
- **Budget:** £0 (free tier / open-source only)

---

## Layer 1: Secret Scanning & Code Security (GitHub + Snyk)

### What it does
Catches leaked API keys, credentials, and vulnerable dependencies before they reach production.

### Setup Steps

#### 1. Enable GitHub Secret Scanning & Push Protection

Navigate to your GitHub repository:
- Settings → Code security and analysis → Enable:
  - ✅ Secret scanning
  - ✅ Push protection
  - ✅ Code scanning (CodeQL)

#### 2. GitHub Workflows

The following workflows are already configured in `.github/workflows/`:

- **`codeql.yml`** - Automated code security analysis
- **`snyk.yml`** - Dependency and code vulnerability scanning
- **`grype.yml`** - Container and filesystem vulnerability scanning

#### 3. Snyk Setup

```bash
# Install Snyk CLI globally
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Test source code
snyk code test

# Enable continuous monitoring
snyk monitor
```

Add `SNYK_TOKEN` to your GitHub repository secrets:
- GitHub → Settings → Secrets and variables → Actions → New repository secret
- Name: `SNYK_TOKEN`
- Value: Your Snyk API token from https://app.snyk.io/account

### Environment Variables to Protect

These must NEVER be committed. Verify with `/check-credentials`:

```env
# Critical Secrets (NEVER commit these)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEO4J_PASSWORD=your-neo4j-password
STRIPE_SECRET_KEY=sk_test_or_live_your_key
META_WHATSAPP_TOKEN=your-whatsapp-token
RAILWAY_TOKEN=your-railway-token
N8N_ENCRYPTION_KEY=your-n8n-key
SENTRY_AUTH_TOKEN=sntrys_your_token
SNYK_TOKEN=your-snyk-token
HELICONE_API_KEY=sk-helicone-your-key
LANGFUSE_SECRET_KEY=sk-lf-your-key
WHYLABS_API_KEY=your-whylabs-key

# Public Keys (Safe to expose in client-side code)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_or_live_your_key
VITE_SENTRY_DSN=https://your-key@ingest.sentry.io/project-id
```

### Free Limits
- GitHub secret scanning + push protection: Unlimited (all repos)
- GitHub CodeQL: Unlimited (public repos)
- Snyk: 200 open-source tests/month + 100 code tests/month

---

## Layer 2: Container & Image Vulnerability Scanning (Grype + Syft)

### What it does
Scans Docker images, filesystems, and dependencies for known CVEs. Generates a Software Bill of Materials (SBOM).

### Setup Steps

#### 1. Install Grype and Syft

```bash
# macOS
brew install grype syft

# Linux
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
```

#### 2. Generate SBOM and Scan

```bash
# Generate Software Bill of Materials
npm run security:sbom

# Scan with Grype
npm run security:scan

# If using Docker, scan your image
docker build -t apinlero-web .
grype apinlero-web:latest --fail-on critical -o table
```

#### 3. GitHub Workflow

The `grype.yml` workflow is already configured and will run on every push and pull request to main.

### Free Limits
- Grype + Syft: Fully open-source, unlimited scans forever

---

## Layer 3: Runtime Monitoring & Error Tracking (Sentry + Uptime Kuma)

### What it does
Tracks application errors, performance, and uptime in production. Sentry catches code errors; Uptime Kuma monitors service availability.

### Sentry Setup

Sentry is already configured in [src/lib/sentry.ts](src/lib/sentry.ts).

#### 1. Add Environment Variables

Add to `.env.local` and Railway:

```env
VITE_SENTRY_DSN=https://your-key@o123456.ingest.sentry.io/1234567
SENTRY_AUTH_TOKEN=sntrys_your_auth_token
```

#### 2. Custom Tracking Examples

```javascript
import * as Sentry from '@sentry/react';

// Track WhatsApp message failures
async function sendWhatsAppMessage(to, message) {
  try {
    const response = await fetch('/api/whatsapp/send', { ... });
    if (!response.ok) {
      Sentry.captureMessage('WhatsApp send failed', {
        level: 'error',
        tags: { service: 'whatsapp', customer: 'ishas-treat' },
        extra: { statusCode: response.status, recipient: to }
      });
    }
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'whatsapp' }
    });
  }
}

// Track Neo4j Knowledge Graph query failures
async function queryKnowledgeGraph(cypher) {
  try {
    const result = await neo4jDriver.executeQuery(cypher);
    return result;
  } catch (error) {
    Sentry.captureException(error, {
      tags: { service: 'neo4j', query_type: 'knowledge-graph' }
    });
    throw error;
  }
}
```

### Uptime Kuma Setup

#### 1. Deploy on Railway

- Railway → New Project → Deploy Template → Search "Uptime Kuma" → Deploy
- Or use Docker image: `louislam/uptime-kuma:1` with port `3001`

#### 2. Add Monitors

Add these monitors in the Uptime Kuma dashboard:

| Monitor | Type | Target | Interval |
|---------|------|--------|----------|
| Àpínlẹ̀rọ Web | HTTP(s) | `https://your-app.up.railway.app` | 60s |
| Supabase API | HTTP(s) | `https://your-project.supabase.co/rest/v1/` | 120s |
| Neo4j | TCP Port | Neo4j host:7687 | 120s |
| n8n | HTTP(s) | `https://your-n8n.up.railway.app` | 60s |
| WhatsApp Webhook | HTTP(s) | `https://your-app/api/whatsapp/webhook` | 60s |

#### 3. Set up Notifications

Configure free notifications via:
- Slack
- Email via Resend
- Telegram
- Discord webhooks

### Free Limits
- Sentry: 5K errors/month + 10K performance transactions/month
- Uptime Kuma: Self-hosted, unlimited monitors forever

---

## Layer 4: AI/LLM Observability (Helicone + Langfuse)

### What it does
Monitors AI-specific concerns: LLM call failures, token costs, prompt quality, hallucinations, data drift, and PII leakage.

### Helicone Setup (LLM Gateway & Cost Tracking)

#### 1. Sign up and Get API Key

- Visit https://helicone.ai
- Create account and get API key

#### 2. Install Helpers

```bash
npm install @helicone/helpers
```

#### 3. Route LLM Calls Through Helicone

For OpenAI:
```javascript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});
```

For Anthropic:
```javascript
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: "https://anthropic.helicone.ai",
  defaultHeaders: {
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
  },
});
```

#### 4. Add Custom Properties for Multi-Tenant Tracking

```javascript
const response = await openai.chat.completions.create(
  { model: "gpt-4o", messages: [...] },
  {
    headers: {
      "Helicone-Property-Customer": "ishas-treat-groceries",
      "Helicone-Property-Feature": "whatsapp-agent",
      "Helicone-Property-Environment": process.env.NODE_ENV,
    }
  }
);
```

#### 5. Enable Caching

```javascript
const response = await openai.chat.completions.create(
  { model: "gpt-4o", messages: [...] },
  {
    headers: {
      "Helicone-Cache-Enabled": "true",
      "Cache-Control": "max-age=3600",
    }
  }
);
```

### Langfuse Setup (LLM Tracing & Prompt Management)

#### 1. Install Langfuse

```bash
npm install langfuse langfuse-vercel @langfuse/openai
```

#### 2. Wrap OpenAI Client

```javascript
import { observeOpenAI } from "@langfuse/openai";
import OpenAI from "openai";

const openai = observeOpenAI(new OpenAI());

// All calls are now automatically traced
const res = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "..." }],
});
```

#### 3. Add Environment Variables

```env
HELICONE_API_KEY=sk-helicone-your-key
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

### Free Limits
- Helicone: 10K requests/month
- Langfuse: 50K events/month (cloud) or unlimited (self-hosted)

---

## Verification Checklist

After setup, verify each layer:

- [ ] **Layer 1:** Push a test file with a fake API key → GitHub should block it
- [ ] **Layer 1:** Run `snyk test` → should show vulnerability report
- [ ] **Layer 2:** Run `npm run security:scan` → should show CVE scan results
- [ ] **Layer 3:** Trigger a test error → should appear in Sentry dashboard
- [ ] **Layer 3:** Check Uptime Kuma → all monitors should be green
- [ ] **Layer 4:** Make an LLM call → should appear in Helicone dashboard
- [ ] **Layer 4:** Make an LLM call → should appear as trace in Langfuse

---

## Complete Environment Variables

Add all of these to Railway and `.env.local`:

```env
# Layer 1: Snyk
SNYK_TOKEN=your-snyk-token

# Layer 3: Sentry
VITE_SENTRY_DSN=https://your-key@ingest.sentry.io/project-id
SENTRY_AUTH_TOKEN=sntrys_your-token

# Layer 4: Helicone
HELICONE_API_KEY=sk-helicone-your-key

# Layer 4: Langfuse
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

---

## Total Monthly Cost: £0

| Tool | Free Tier |
|------|-----------|
| GitHub Secret Scanning | Unlimited |
| Snyk | 200 tests/month |
| Grype + Syft | Open-source |
| Sentry | 5K errors + 10K txns/month |
| Uptime Kuma | Self-hosted, unlimited |
| Helicone | 10K requests/month |
| Langfuse | 50K events/month or self-host |

**When to upgrade:** Revenue > £5K/month → Consider Datadog APM, paid Sentry, paid Helicone.

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/apinlero/issues
- Documentation: See individual tool documentation links above
