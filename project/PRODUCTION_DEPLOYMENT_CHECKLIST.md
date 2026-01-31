# Production Deployment Checklist

Use this checklist for every production deployment.

## 📋 Pre-Deployment

### Code Quality
- [ ] Local build succeeds: `npm run build`
- [ ] TypeScript compiles: `npm run typecheck` (warnings OK, errors should be addressed)
- [ ] No critical linter errors
- [ ] All tests pass: `npm test` (if applicable)

### Git Status
- [ ] All changes committed
- [ ] On main/master branch
- [ ] Branch is up to date with remote: `git pull origin main`
- [ ] No merge conflicts

### Configuration
- [ ] `vercel.json` exists and is valid
- [ ] `package.json` has engines field
- [ ] `.nvmrc` file exists (Node 18)
- [ ] `.env.example` is up to date

### Environment Variables
- [ ] All required `VITE_*` variables set in Vercel dashboard
- [ ] Supabase URL and anon key configured
- [ ] Stripe publishable key added (if using payments)
- [ ] All env vars match between environments

## 🚀 Deployment

### Automatic (Recommended)
- [ ] Run: `/fix-deploy`
- [ ] Wait for completion (~60 seconds)
- [ ] Check output for errors

### Manual (Alternative)
- [ ] Commit changes: `git commit -m "deploy: description"`
- [ ] Push to GitHub: `git push origin main`
- [ ] Wait for Vercel webhook to trigger
- [ ] Or manually deploy: `npx vercel --prod --yes`

## ✅ Post-Deployment Verification

### Build Verification
- [ ] Vercel build completed successfully
- [ ] No build errors in Vercel logs
- [ ] Deployment status shows "Ready"
- [ ] Production URL is accessible

### Application Testing
- [ ] Homepage loads: https://app.apinlero.com
- [ ] Login page works: https://app.apinlero.com/login
- [ ] Dashboard loads (after login)
- [ ] No JavaScript errors in browser console
- [ ] Network requests succeed (check DevTools)

### Feature Testing
- [ ] User registration works
- [ ] User login works
- [ ] Password reset flow works
- [ ] Product catalog loads
- [ ] Categories display correctly (32 categories)
- [ ] Category filtering works
- [ ] Product search works
- [ ] Cart functionality works

### Performance
- [ ] Page load time < 3 seconds
- [ ] No 404 errors on assets
- [ ] Images load correctly
- [ ] CSS styles applied correctly

## 🗄️ Database (If Updated)

- [ ] Migrations run in production Supabase
- [ ] RLS policies enabled
- [ ] Test data seeded (if needed)
- [ ] Database connections working

### Required Migrations (If Not Run Yet)
- [ ] `20260127000000_add_business_id_to_core_tables.sql`
- [ ] `20260127000001_backfill_business_id.sql`
- [ ] `20260127000002_enable_rls_policies.sql`
- [ ] `20260127010000_add_stripe_encryption.sql`

## 💳 Stripe (If Using Payments)

- [ ] Webhook endpoint configured: `https://app.apinlero.com/api/webhooks/stripe`
- [ ] Webhook events selected: `payment_intent.succeeded`, `payment_intent.failed`
- [ ] Webhook secret added to Vercel env vars
- [ ] Test payment flow in test mode
- [ ] Verify payment intent creation

## 📊 Monitoring

- [ ] Check Vercel Analytics dashboard
- [ ] Monitor Sentry for errors (if configured)
- [ ] Check application logs
- [ ] Set up alerts for downtime

## 🔧 Troubleshooting

### If Deployment Fails
1. Check Vercel logs: https://vercel.com/apinlero/project/deployments
2. Run local build: `npm run build`
3. Check TypeScript: `npm run typecheck`
4. Verify environment variables in Vercel
5. Try manual deploy: `npx vercel --prod --yes --force`
6. Use automated fix: `/fix-deploy`

### If Application Shows Errors
1. Check browser console for errors
2. Verify Supabase connection (check env vars)
3. Check Network tab for failed API calls
4. Verify database migrations ran
5. Check Vercel function logs

### If Rollback Needed
1. Go to: https://vercel.com/apinlero/project/deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Or use: `/fix-deploy rollback`

## 📝 Post-Deployment Tasks

- [ ] Update CHANGELOG.md (if exists)
- [ ] Notify team of deployment
- [ ] Monitor for first 30 minutes
- [ ] Test critical user flows
- [ ] Check error rates in monitoring tools

## 🎯 Success Criteria

Deployment is successful when:
- ✅ Build completes without errors
- ✅ Production URL is accessible
- ✅ No critical JavaScript errors
- ✅ All core features work
- ✅ Database queries succeed
- ✅ Authentication flows work
- ✅ No 500 errors in logs

## 🚨 Rollback Criteria

Rollback immediately if:
- ❌ Application completely inaccessible
- ❌ Critical features broken (login, payments)
- ❌ Database connection errors
- ❌ High error rate (>5% of requests)
- ❌ Security vulnerability introduced

## 📞 Emergency Contacts

- **Vercel Dashboard**: https://vercel.com/apinlero/project
- **Supabase Dashboard**: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc
- **Stripe Dashboard**: https://dashboard.stripe.com

## 📚 Documentation

- **Deployment Guide**: `VERCEL_DEPLOYMENT.md`
- **Session Summary**: `DEPLOYMENT_SESSION_2026-01-28.md`
- **Fixes Applied**: `DEPLOYMENT_FIXES_APPLIED.md`
- **Automation Skill**: `~/.claude/skills/fix-deploy.md`

---

## 🎯 Quick Deploy Command

For stress-free deployment:
```bash
/fix-deploy
```

This handles everything on this checklist automatically! ✨

---

*Last Updated: January 28, 2026*
*Template Version: 1.0*
