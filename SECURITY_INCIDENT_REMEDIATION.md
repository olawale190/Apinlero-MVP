# Security Incident Remediation Guide

## Incident Summary

**Date Detected:** January 26, 2026
**Detection Source:** GitGuardian
**Severity:** CRITICAL
**Secret Type:** Supabase Service Role JWT
**Repository:** olawale190/Apinlero-MVP
**Status:** IN PROGRESS

---

## What Was Exposed

The following credentials were exposed in your public GitHub repository:

1. **Supabase Service Role JWT** (CRITICAL)
   - Found in multiple script files committed to git history
   - Provides full admin access to your Supabase project
   - Bypasses Row Level Security (RLS)

2. **Supabase Anon Key** (LOW RISK)
   - Public key meant to be exposed
   - Protected by RLS policies

3. **Twilio Credentials** (MODERATE)
   - Account SID and Auth Token
   - Found in documentation files

4. **Neo4j Credentials** (MODERATE)
   - Database password
   - Found in documentation files

5. **PostgreSQL Database Password** (CRITICAL)
   - Found in shell script
   - Provides direct database access

---

## Files Cleaned

The following files have been cleaned and credentials removed:

### Documentation Files:
- ✅ `STEP_BY_STEP_GUIDE.md` - Credentials replaced with placeholders
- ✅ `SESSION_SUMMARY.md` - Credentials redacted
- ✅ `.gitignore` - Updated to ignore sensitive files

### Script Files:
- ✅ `project/scripts/disable-rls-temp.js` - Now uses env vars
- ✅ `project/scripts/execute-migrations-now.js` - Now uses env vars
- ✅ `project/scripts/execute-migrations.js` - Now uses env vars
- ✅ `project/scripts/execute-migrations.sh` - Now uses env vars
- ✅ `project/scripts/execute-rls-fix.sh` - Now uses env vars
- ✅ `project/scripts/fix-rls-quick.js` - Now uses env vars
- ✅ `project/scripts/fix-rls-policy.js` - Now uses env vars
- ✅ `project/scripts/cleanup-placeholder-products.js` - Now uses env vars

---

## Immediate Actions Required

### Step 1: Revoke Compromised Supabase Service Role Key ⚠️ CRITICAL

1. Go to your Supabase dashboard:
   ```
   https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/settings/api
   ```

2. In the "Project API keys" section, click "Reset service_role key"

3. **Important:** This will immediately invalidate the compromised key

### Step 2: Generate New Service Role Key

1. After resetting, copy the new service_role key

2. Update your local environment files (NOT in git):
   - `project/.env`
   - `whatsapp-bot/.env`

3. Update deployment environments:
   - **Vercel:** Go to your project settings → Environment Variables → Update `SUPABASE_SERVICE_KEY`
   - **Railway:** Go to your project → Variables → Update `SUPABASE_SERVICE_KEY`

### Step 3: Revoke/Rotate Other Credentials

#### Twilio (if concerned):
1. Go to: https://console.twilio.com
2. Navigate to Account → API Keys & Tokens
3. Rotate your Auth Token if needed

#### Neo4j (if concerned):
1. Go to: https://console.neo4j.io
2. Navigate to your database → Settings
3. Reset your password

#### PostgreSQL Database:
1. Go to: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/settings/database
2. Click "Reset database password"
3. Update `DB_PASSWORD` in your environment variables

---

## Git History Cleanup

The compromised credentials exist in your git history across multiple commits. You need to remove them from git history before they can be safely used again.

### Option 1: Use BFG Repo-Cleaner (Recommended)

1. **Install BFG:**
   ```bash
   # macOS
   brew install bfg

   # Or download from: https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **Backup your repository:**
   ```bash
   cd /Users/user/Documents/Lazrap/SaaS/Apinlero
   cp -r Apinlero_MVP Apinlero_MVP_BACKUP
   ```

3. **Create a text file with the secrets to remove:**
   ```bash
   cat > secrets.txt << 'EOF'
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZm9lemRwYW90d3ZwZmxkeWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE3MTQ4NywiZXhwIjoyMDgwNzQ3NDg3fQ.o3iNhUEMQ5kUoRoEcu-YdAq8gFB9CHKtaHu9SsXD-VM
y2KyN58yVFnDh2wi
5f4002ba18c59c1710ac6cf4f48c3a48
Ya808eDj0p7LRTs0LZIDSXsYB6uA6OyFKTCw-y0C_jQ
EOF
   ```

4. **Run BFG to clean history:**
   ```bash
   cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP
   bfg --replace-text ../secrets.txt --no-blob-protection .
   ```

5. **Clean up and force push:**
   ```bash
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

### Option 2: Use git-filter-repo

1. **Install git-filter-repo:**
   ```bash
   pip3 install git-filter-repo
   ```

2. **Create expressions file:**
   ```bash
   cat > expressions.txt << 'EOF'
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZm9lemRwYW90d3ZwZmxkeWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE3MTQ4NywiZXhwIjoyMDgwNzQ3NDg3fQ.o3iNhUEMQ5kUoRoEcu-YdAq8gFB9CHKtaHu9SsXD-VM==>***REMOVED_SERVICE_KEY***
y2KyN58yVFnDh2wi==>***REMOVED_DB_PASSWORD***
5f4002ba18c59c1710ac6cf4f48c3a48==>***REMOVED_TWILIO_TOKEN***
Ya808eDj0p7LRTs0LZIDSXsYB6uA6OyFKTCw-y0C_jQ==>***REMOVED_NEO4J_PASSWORD***
EOF
   ```

3. **Run git-filter-repo:**
   ```bash
   git filter-repo --replace-text expressions.txt --force
   ```

4. **Force push:**
   ```bash
   git push --force
   ```

### Option 3: Nuclear Option - Delete and Recreate Repository

If the above options are too complex or fail:

1. **Create a new empty repository on GitHub**

2. **Remove git history locally:**
   ```bash
   cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP
   rm -rf .git
   git init
   git add .
   git commit -m "Initial commit with security fixes"
   ```

3. **Push to new repository:**
   ```bash
   git remote add origin https://github.com/olawale190/NEW-REPO-NAME.git
   git branch -M main
   git push -u origin main
   ```

4. **Delete the old repository** from GitHub to prevent future exposure

---

## Verification Steps

After cleaning git history and rotating credentials:

1. **Verify credentials are removed from git history:**
   ```bash
   git log --all --full-history --source --all -- "*" | grep -i "eyJhbGci"
   ```
   (Should return nothing)

2. **Verify new credentials work:**
   ```bash
   cd project
   export SUPABASE_SERVICE_KEY="your_new_key_here"
   node scripts/disable-rls-temp.js
   ```

3. **Check GitHub for exposed secrets:**
   - Go to: https://github.com/olawale190/Apinlero-MVP/settings/security_analysis
   - Verify no secrets are detected

---

## Prevention Measures

### 1. Git Hooks (Recommended)

Install a pre-commit hook to prevent committing secrets:

```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP

# Install pre-commit
pip3 install pre-commit

# Create .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
EOF

# Install the hooks
pre-commit install

# Create baseline
detect-secrets scan > .secrets.baseline
```

### 2. Use GitGuardian CLI (ggshield)

```bash
# Install
pip3 install ggshield

# Scan current state
ggshield secret scan repo .

# Install pre-commit hook
ggshield install --mode pre-commit
```

### 3. Environment Variable Management

- ✅ Use `.env` files (already in `.gitignore`)
- ✅ Never commit `.env` files
- ✅ Use `.env.example` for documentation (without real values)
- ✅ Load environment variables in scripts (as we've now done)

### 4. Regular Security Audits

- Scan your repository monthly: `ggshield secret scan repo .`
- Review GitHub's secret scanning alerts
- Keep dependencies updated

---

## Current Status

- ✅ Local files cleaned
- ✅ Scripts updated to use environment variables
- ✅ `.gitignore` updated
- ⚠️ **NOT DONE:** Supabase Service Role key not yet revoked
- ⚠️ **NOT DONE:** New Service Role key not yet generated
- ⚠️ **NOT DONE:** Git history not yet cleaned
- ⚠️ **NOT DONE:** Other credentials not yet rotated

---

## Next Steps

1. **RIGHT NOW:** Revoke the compromised Supabase Service Role key
2. **TODAY:** Clean git history using one of the methods above
3. **TODAY:** Rotate other compromised credentials (Twilio, Neo4j, PostgreSQL)
4. **THIS WEEK:** Set up pre-commit hooks to prevent future leaks
5. **THIS WEEK:** Review all deployment environment variables

---

## Support Resources

- **GitGuardian Guide:** https://docs.gitguardian.com/secrets-detection/secrets-detection-engine/detector-specificity
- **Supabase Security:** https://supabase.com/docs/guides/platform/going-into-prod#security
- **BFG Repo-Cleaner:** https://rtyley.github.io/bfg-repo-cleaner/
- **GitHub Secret Scanning:** https://docs.github.com/en/code-security/secret-scanning

---

## Questions?

If you need help with any of these steps, please ask!
