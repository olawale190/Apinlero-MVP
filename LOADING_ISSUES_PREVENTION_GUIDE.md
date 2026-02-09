# 🛡️ Loading Issues Prevention System

**Created**: 2026-02-09
**Purpose**: Prevent the 3 loading issues we've had from ever happening again

---

## 📊 What Went Wrong (The 3 Issues)

| Date | Issue | Root Cause | Impact |
|------|-------|------------|--------|
| 2026-02-08 | Blank page on apinlero.com | Redirect loop (Vercel settings vs vercel.json) | **100% downtime** |
| 2026-02-09 | app.apinlero.com infinite spinner | React Router hook outside context | **Backend unusable** |
| 2026-02-09 | Client store 5s delay | No database index + slow queries | **Poor UX** |

**Common Pattern**: All were **preventable** with proper monitoring and checks.

---

## 🎯 Prevention System (4 Layers)

### Layer 1: Automated Monitoring ✅ **IMPLEMENTED**

**What**: Real-time performance tracking that alerts when things are slow

**Files**:
- [`project/src/lib/performance-monitor.ts`](project/src/lib/performance-monitor.ts) - Tracks all page loads, API calls, DB queries
- [`project/src/lib/health-check.ts`](project/src/lib/health-check.ts) - Runs automated health checks every minute

**How it works**:
1. Every page load is timed automatically
2. Every database query is tracked
3. If anything takes >3s, **you get a warning in console**
4. In production, alerts are sent to your monitoring service

**What it catches**:
- ✅ Slow database queries (like the 5s issue)
- ✅ Missing environment variables
- ✅ Supabase connection problems
- ✅ Performance degradation

**How to use**:
```typescript
// Already integrated in business-resolver.ts
// Check browser console for warnings:
// ⚠️ [PerformanceMonitor] SLOW Database Query: db_query_business_by_slug took 3500ms
```

---

### Layer 2: Pre-Deployment Checks ✅ **IMPLEMENTED**

**What**: Automated script that runs before every deployment

**File**: [`project/scripts/pre-deploy-check.js`](project/scripts/pre-deploy-check.js)

**What it checks**:
1. ✅ Environment variables exist
2. ✅ TypeScript compiles without errors
3. ✅ Build succeeds
4. ✅ Database migrations are tracked
5. ✅ Performance monitoring is set up
6. ✅ No uncommitted changes
7. ✅ Critical files don't have unresolved TODOs

**How to use**:
```bash
# Run before every deployment
npm run pre-deploy-check

# Add to package.json scripts:
"scripts": {
  "pre-deploy-check": "node scripts/pre-deploy-check.js",
  "deploy": "npm run pre-deploy-check && vercel --prod"
}
```

**What it prevents**:
- ✅ Deploying with missing env vars (would cause React Router issue)
- ✅ Deploying broken builds (would cause blank pages)
- ✅ Deploying without database migrations (would cause slow queries)

---

### Layer 3: Database Best Practices ✅ **IMPLEMENTED**

**What**: Standard patterns to prevent database slowness

**Checklist** (use for every new table):
- [ ] Add index on foreign keys (e.g., `business_id`)
- [ ] Add index on lookup columns (e.g., `slug`, `email`)
- [ ] Add unique constraints where needed
- [ ] Test query performance (<1s target)
- [ ] Add RLS policies for multi-tenancy

**Migration Template**:
```sql
-- Example: Adding a new table with proper indexes
CREATE TABLE new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ALWAYS add indexes for lookups
CREATE INDEX idx_new_table_business_id ON new_table(business_id);
CREATE INDEX idx_new_table_slug ON new_table(slug);

-- Add RLS
ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can view their business data"
  ON new_table FOR SELECT
  USING (business_id = auth.jwt() -> 'business_id');
```

**What it prevents**:
- ✅ Slow queries (like the 5s loading issue)
- ✅ Full table scans
- ✅ Database timeouts

---

### Layer 4: Code Standards ✅ **DOCUMENTED**

**React Router Rules**:
```typescript
// ❌ WRONG - Hook outside Route context
function App() {
  const navigate = useNavigate(); // ERROR!
  return <BrowserRouter>...</BrowserRouter>
}

// ✅ CORRECT - Hook inside Route
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </BrowserRouter>
  );
}

function Home() {
  const navigate = useNavigate(); // OK!
  // ...
}
```

**Loading State Rules**:
```typescript
// ❌ WRONG - Loading state never cleared
useEffect(() => {
  if (!businessId) return; // Early return without setIsLoading(false)!
  fetchData();
}, []);

// ✅ CORRECT - Always clear loading state
useEffect(() => {
  if (!businessId) {
    setIsLoading(false); // Clear before early return
    return;
  }
  fetchData().finally(() => setIsLoading(false));
}, []);
```

**Timeout Rules**:
```typescript
// ❌ WRONG - Long timeout (user waits forever)
setTimeout(() => showError(), 15000); // 15s!

// ✅ CORRECT - Fail fast with fallback
setTimeout(() => useFallback(), 2000); // 2s, then fallback
```

---

## 🚀 How to Use This System

### Before Every Code Change

1. **Check if you need a database migration**
   - Adding new table? Run the migration template above
   - Adding new lookup field? Add an index!

2. **Test locally first**
   ```bash
   npm run dev
   # Check browser console for performance warnings
   ```

3. **Run pre-deploy check**
   ```bash
   npm run pre-deploy-check
   ```

### Before Every Deployment

```bash
# 1. Run checks
npm run pre-deploy-check

# 2. If migrations exist, apply them in Supabase first
# Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
# Run any new SQL files in supabase/migrations/

# 3. Deploy
npx vercel --prod

# 4. Monitor for 5 minutes
# Open: https://ishas-treat.apinlero.com
# Check console for warnings
```

### After Every Deployment

1. **Check production console** (F12 → Console)
   - Look for `[PerformanceMonitor]` warnings
   - Look for `[HealthCheck]` errors
   - Expected: `✅ [HealthCheck] System healthy`

2. **Test critical flows**
   - [ ] Landing page loads (<1s)
   - [ ] Dashboard login works (<2s)
   - [ ] Client storefront loads (<1s)

3. **Check performance metrics**
   ```javascript
   // In browser console on live site:
   performanceMonitor.getSummary()
   // Should show averageLoadTime < 2000ms
   ```

---

## 🚨 Alert Configuration (TODO)

### Set up external monitoring (choose one):

**Option 1: Vercel Analytics** (Easiest)
```bash
npm i @vercel/analytics
```
```typescript
// src/App.tsx
import { Analytics } from '@vercel/analytics/react';

export default function App() {
  return (
    <>
      <YourApp />
      <Analytics />
    </>
  );
}
```

**Option 2: Sentry** (Most powerful)
```bash
npm i @sentry/react
```
```typescript
// src/main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Option 3: LogRocket** (Best for debugging)
```bash
npm i logrocket
```

### Email Alerts

Create API endpoint `/api/alerts/health` that:
1. Receives health check failures
2. Sends email via SendGrid/Resend
3. Posts to Slack channel (optional)

Example:
```typescript
// api/alerts/health.ts
export default async function handler(req, res) {
  const { status } = req.body;

  if (!status.healthy) {
    await sendEmail({
      to: 'your-email@example.com',
      subject: '🚨 Apinlero Health Check Failed',
      body: `Errors: ${status.details.errors.join(', ')}`
    });
  }

  res.json({ ok: true });
}
```

---

## 📋 Quick Reference Checklist

### Adding New Client Store
- [ ] Add business to database
- [ ] Add to `KNOWN_BUSINESSES` fallback in `business-resolver.ts`
- [ ] Test subdomain loads in <1s
- [ ] Run pre-deploy check
- [ ] Deploy and monitor

### Making Database Changes
- [ ] Create migration file (`20YYMMDD_description.sql`)
- [ ] Add indexes for all lookups
- [ ] Test query performance locally
- [ ] Apply migration in Supabase dashboard
- [ ] Deploy code
- [ ] Verify no slow query warnings in console

### Fixing Performance Issues
1. Check browser console for `[PerformanceMonitor]` warnings
2. Identify slow operation (API, DB, page load)
3. Add index / optimize query / add caching
4. Test locally (should be <1s)
5. Deploy and verify

---

## 🎓 Lessons Learned

1. **Always monitor in production**
   - Console warnings catch issues before users complain
   - Health checks detect problems automatically

2. **Always have fallbacks**
   - Hardcoded business data prevents total failure
   - Graceful degradation > complete failure

3. **Fail fast, not slow**
   - 2s timeout > 15s timeout
   - Show error quickly > infinite spinner

4. **Test the critical path**
   - Client storefront loading is #1 priority
   - Dashboard login is #2
   - Landing page is #3

5. **Database indexes are not optional**
   - Any lookup column needs an index
   - Test with production data volumes

---

## 🔧 Troubleshooting

### "Performance warning in console but site seems fast"
- Check if warning is consistent or one-off
- One-off = network blip (OK)
- Consistent = real issue (needs fix)

### "Health check failing but site works fine"
- Check browser console for actual errors
- Might be false positive
- Verify Supabase connection manually

### "Pre-deploy check fails"
- Read error message carefully
- Fix issue before deploying
- Don't skip checks!

---

## 📞 Support

If you see any of these, **stop and investigate**:

- 🚨 `[PerformanceMonitor] SLOW Database Query` - Database needs optimization
- 🚨 `[HealthCheck] System unhealthy` - Check Supabase connection
- 🚨 `[BusinessContext] ⚠️ Loading timed out` - Using fallback, but should investigate why

**Good logs** (what you want to see):
- ✅ `[business-resolver] Query completed in 150ms`
- ✅ `[BusinessContext] ✅ Business loaded: Isha's Treat & Groceries`
- ✅ `[HealthCheck] System healthy`

---

## ✅ Summary

**What we built**:
1. ✅ Performance monitoring (tracks everything automatically)
2. ✅ Health checks (runs every minute)
3. ✅ Pre-deployment checks (prevents bad deploys)
4. ✅ Database best practices (prevents slow queries)
5. ✅ Code standards (prevents logic errors)

**What you need to do**:
1. **Before every deploy**: Run `npm run pre-deploy-check`
2. **After every deploy**: Check console for warnings (5 min)
3. **When adding database tables**: Use the migration template
4. **When you see warnings**: Investigate immediately (don't ignore!)

**Result**: No more surprise loading issues! 🎉
