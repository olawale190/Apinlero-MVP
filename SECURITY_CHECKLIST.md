# Security Checklist - Credential Rotation

Use this checklist to track your credential rotation progress.

---

## Immediate Actions (Do Today)

### 1. Resend API Key
- [ ] Login to [resend.com/api-keys](https://resend.com/api-keys)
- [ ] Create new API key named `apinlero-production-v2`
- [ ] Copy new key (starts with `re_`)
- [ ] Update `Apinlero_MVP/project/.env.local`
- [ ] Update Vercel environment variable
- [ ] Delete old key from Resend dashboard
- [ ] Test email at `/email-settings`
- [ ] Deploy to production: `npx vercel --prod --yes`

### 2. Supabase Service Key
- [ ] Login to [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Select project: `gafoezdpaotwvpfldyhc` (ApinleroMVP)
- [ ] Go to Settings → API
- [ ] Click "Generate new service_role key"
- [ ] Copy new key (starts with `eyJ`)
- [ ] Update Railway (WhatsApp bot) → Variables → `SUPABASE_SERVICE_KEY`
- [ ] Update `Apinlero_MVP/whatsapp-bot/.env`
- [ ] Update `Apinlero_MVP/project/knowledge-graph/.env` (if exists)
- [ ] Test WhatsApp bot: `npm run dev`
- [ ] Verify Railway deployment

### 3. Twilio Auth Token
- [ ] Login to [console.twilio.com](https://console.twilio.com)
- [ ] Go to Account → API keys & tokens
- [ ] Click "Create secondary token"
- [ ] Copy new token
- [ ] Click "Promote to Primary"
- [ ] Delete old secondary token
- [ ] Update Railway → Variables → `TWILIO_AUTH_TOKEN`
- [ ] Update `Apinlero_MVP/whatsapp-bot/.env`
- [ ] Test WhatsApp bot (send test message)

---

## Optional (If Using These Services)

### 4. Stripe API Keys
- [ ] Login to [dashboard.stripe.com/apikeys](https://dashboard.stripe.com/apikeys)
- [ ] Create new restricted key
- [ ] Copy publishable key (`pk_...`)
- [ ] Copy secret key (`sk_...`)
- [ ] Update `Apinlero_MVP/project/.env.local`
- [ ] Update Vercel environment variables
- [ ] Delete old keys from Stripe
- [ ] Test payment flow

### 5. Neo4j Credentials
**Note:** Free tier doesn't support rotation. Options:
- [ ] **Option A:** Keep current (low risk - only product aliases)
- [ ] **Option B:** Create new Aura instance
  - [ ] Export data from old instance
  - [ ] Create new Aura free instance
  - [ ] Import data
  - [ ] Update Railway → Variables
  - [ ] Update local `.env` files
  - [ ] Test product matching

---

## Verification Tests

### Local Development
- [ ] Frontend runs: `cd project && npm run dev`
- [ ] Backend runs: `cd whatsapp-bot && npm run dev`
- [ ] Email test passes (visit `/email-settings`)
- [ ] WhatsApp bot responds to test message
- [ ] No console errors

### Production Deployment
- [ ] Vercel deployment succeeds
- [ ] Railway deployment succeeds
- [ ] Production site loads: `https://app.apinlero.com`
- [ ] Login works
- [ ] Email notifications work
- [ ] WhatsApp bot works
- [ ] Stripe payments work (if applicable)

### Security Verification
- [ ] Pre-commit hook blocks secrets:
  ```bash
  echo "SECRET_KEY=test123" > test.txt
  git add test.txt && git commit -m "test"
  # Should be blocked
  rm test.txt && git reset HEAD test.txt
  ```
- [ ] No `.env` files in git: `git ls-files | grep "\.env$"`
- [ ] All credentials in `.gitignore`
- [ ] No secrets in recent commits: `git log -p -S "API_KEY" --all`

---

## Post-Rotation Cleanup

### Update Documentation
- [ ] Mark this checklist complete
- [ ] Update `CLAUDE.md` with rotation date
- [ ] Document any issues encountered
- [ ] Update team (if applicable)

### Delete Old Credentials
- [ ] Remove old Resend key from dashboard
- [ ] Remove old Twilio token from dashboard
- [ ] Remove old Stripe keys from dashboard
- [ ] Clear clipboard (to avoid pasting old keys)

### Audit Files
- [ ] Search for old keys in files:
  ```bash
  cd Apinlero_MVP
  # Search all .env files (should find nothing in git)
  git ls-files | grep "\.env"
  ```
- [ ] Check for hardcoded secrets:
  ```bash
  grep -r "re_[A-Za-z0-9]" . --exclude-dir=node_modules
  grep -r "eyJ[A-Za-z0-9]" . --exclude-dir=node_modules
  ```

---

## Monthly Security Audit (Optional)

- [ ] Run `npm audit` in both `project/` and `whatsapp-bot/`
- [ ] Check for new security advisories
- [ ] Review GitHub security alerts
- [ ] Test pre-commit hook still works
- [ ] Verify all environment variables match documentation

---

## Emergency Contacts

If you get stuck:

| Service | Support |
|---------|---------|
| Resend | support@resend.com |
| Supabase | support@supabase.com |
| Twilio | support.twilio.com |
| Stripe | support.stripe.com |
| Vercel | vercel.com/support |
| Railway | railway.app/help |

---

## Completion

- [ ] **All critical credentials rotated**
- [ ] **All services tested and working**
- [ ] **Old credentials deleted from dashboards**
- [ ] **Security verification passed**

**Rotation completed on:** ___________________

**Completed by:** ___________________

**Next rotation due:** ___________________ (recommended: 3 months from today)

---

## Notes

Use this space to document any issues or special considerations:

```
[Your notes here]
```

---

*Last Updated: February 4, 2026*
