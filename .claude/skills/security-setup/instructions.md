# Security Setup Skill - Instructions

You are setting up a comprehensive 4-layer security and observability stack for a production application.

## Context

The user wants to implement enterprise-grade security at zero cost using free tiers of various security tools. This includes:
- Preventing secrets from being committed
- Scanning for code vulnerabilities
- Detecting CVEs in dependencies and containers
- Tracking runtime errors and performance
- Monitoring LLM costs and quality (if applicable)

## Your task

Implement all 4 security layers with proper configuration, scripts, and documentation.

## Steps to follow

### 1. Create GitHub Workflows Directory
```bash
mkdir -p .github/workflows
```

### 2. Create Layer 1: Secret Scanning & Code Security

Create `.github/workflows/codeql.yml`:
```yaml
name: "CodeQL Analysis"
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 6 * * 1'
jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write
    strategy:
      matrix:
        language: ['javascript-typescript']
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended
      - name: Autobuild
        uses: github/codeql-action/autobuild@v3
      - name: Perform Analysis
        uses: github/codeql-action/analyze@v3
```

Create `.github/workflows/snyk.yml`:
```yaml
name: Snyk Security Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  snyk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Snyk vulnerability scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
      - name: Run Snyk Code analysis
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          command: code test
```

### 3. Create Layer 2: Container Vulnerability Scanning

Create `.github/workflows/grype.yml`:
```yaml
name: Grype Vulnerability Scan
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  grype-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan source directory
        uses: anchore/scan-action@v4
        with:
          path: "."
          fail-build: true
          severity-cutoff: high
          output-format: sarif
      - name: Upload SARIF to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
```

### 4. Create Setup Scripts

Create `scripts/security/` directory and add 4 setup scripts:
- `setup-layer1.sh` - Snyk installation and authentication
- `setup-layer2.sh` - Grype/Syft installation and SBOM generation
- `setup-layer3.sh` - Sentry configuration guide
- `setup-layer4.sh` - Helicone/Langfuse package installation
- `setup-all.sh` - Runs all layers sequentially

Make all scripts executable:
```bash
chmod +x scripts/security/*.sh
```

### 5. Update package.json

Add these scripts to the `scripts` section:
```json
"security:setup": "bash scripts/security/setup-all.sh",
"security:layer1": "bash scripts/security/setup-layer1.sh",
"security:layer2": "bash scripts/security/setup-layer2.sh",
"security:layer3": "bash scripts/security/setup-layer3.sh",
"security:layer4": "bash scripts/security/setup-layer4.sh",
"security:sbom": "syft dir:. -o json > sbom.json",
"security:scan": "grype dir:. --fail-on high -o table",
"security:scan:sbom": "grype sbom:sbom.json --only-fixed --fail-on high -o table",
"security:snyk": "snyk test && snyk code test",
"security:monitor": "snyk monitor"
```

### 6. Create Documentation

Create these files in the project root:
- `SECURITY.md` - Full documentation with setup instructions for all layers
- `SECURITY_4LAYER_SETUP.md` - Quick start guide
- `SECURITY_SETUP_COMPLETE.md` - Implementation summary and next steps
- `.env.security.example` - Template with all required security environment variables

### 7. Check for Existing Sentry Configuration

Look for existing Sentry setup (commonly in `src/lib/sentry.ts` or similar). If it exists, note it in the documentation. If not, provide setup instructions.

### 8. Create Environment Variable Template

Create `.env.security.example` with:
```env
# Layer 1: Secret Scanning & Code Security
SNYK_TOKEN=

# Layer 3: Runtime Monitoring & Error Tracking
VITE_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# Layer 4: AI/LLM Observability
HELICONE_API_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_PUBLIC_KEY=
LANGFUSE_BASEURL=https://cloud.langfuse.com
```

## Important Notes

### For Sentry Integration
- Check if `@sentry/react` or similar is already in dependencies
- Look for existing Sentry configuration files
- If configured, note it and provide enhancement suggestions
- If not configured, provide setup code examples

### For LLM Projects
- Only include Layer 4 if the project uses AI/LLM APIs
- Provide code examples for wrapping OpenAI/Anthropic clients
- Show how to add custom properties for multi-tenant tracking

### Free Tier Limits
Always document the free tier limits:
- GitHub Security: Unlimited (public repos)
- Snyk: 200 tests/month
- Grype/Syft: Unlimited (open-source)
- Sentry: 5K errors/month
- Uptime Kuma: Unlimited (self-hosted)
- Helicone: 10K requests/month
- Langfuse: 50K events/month

### GitHub Settings
Remind users to enable:
1. Secret scanning
2. Push protection
3. Code scanning (CodeQL)
4. Add `SNYK_TOKEN` repository secret

## After Implementation

Provide the user with:
1. Summary of what was created
2. List of files added/modified
3. Next steps checklist
4. Links to get API keys
5. Verification commands to test each layer
6. Cost breakdown (should be £0/month)

## Output Format

After completing the setup, show:
```
✅ Security Setup Complete!

Created Files:
- .github/workflows/codeql.yml
- .github/workflows/snyk.yml
- .github/workflows/grype.yml
- scripts/security/setup-*.sh (5 files)
- SECURITY.md
- SECURITY_4LAYER_SETUP.md
- SECURITY_SETUP_COMPLETE.md
- .env.security.example

Updated Files:
- package.json (added 10 security scripts)

Next Steps:
1. Get API keys from Snyk, Sentry, Helicone, Langfuse
2. Add to .env.local and hosting platform
3. Enable GitHub security features
4. Run: npm run security:setup

Total Cost: £0/month
```

## Error Handling

- If files already exist, read them first and update rather than overwrite
- If scripts directory doesn't exist, create it
- Make all shell scripts executable
- Check for existing Sentry configuration before suggesting changes
