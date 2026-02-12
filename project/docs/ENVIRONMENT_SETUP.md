# Environment Variables Setup Guide

This guide explains all environment variables needed for the Àpínlẹ̀rọ platform and how to prevent configuration issues.

## 🎯 Quick Start Checklist

Before starting your application, run:

```bash
npm run check-env
```

This will validate that all required environment variables are set.

---

## 📁 Environment Files

The application uses **two** separate `.env` files:

### 1. Frontend Environment (`.env`)
Location: `/project/.env`

### 2. Backend Environment (`backend/.env`)
Location: `/project/backend/.env`

---

## 🔑 Required Environment Variables

### Frontend Variables (`.env`)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Supabase public/anonymous key | `eyJhbGci...` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (safe to expose) | `pk_test_...` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |

**Optional Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_ENABLE_STRIPE_PAYMENTS` | Enable/disable Stripe payments | `true` |

---

### Backend Variables (`backend/.env`)

| Variable | Description | Example | Where to Get |
|----------|-------------|---------|--------------|
| `SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `SUPABASE_ANON_KEY` | Supabase public/anonymous key | `eyJhbGci...` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ **SECRET** Supabase admin key | `sbp_...` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API → service_role |
| `STRIPE_SECRET_KEY` | ⚠️ **SECRET** Stripe secret key | `sk_test_...` | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |

**Optional Variables:**

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `NODE_ENV` | Environment mode | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret (production only) | Not required for dev |

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep `.env` files in `.gitignore` (already configured)
- Use `test` keys during development
- Rotate keys if accidentally exposed
- Store production keys in secure vault (Vercel, Railway, etc.)
- Use different keys for test and production

### ❌ DON'T:
- Commit `.env` files to version control
- Share secret keys in chat/email (except with trusted tools like this)
- Use production keys in development
- Hard-code keys in source code

---

## 🚨 Preventing Missing Environment Variables

### Method 1: Use the Validation Script

**Before starting your app:**
```bash
npm run check-env
```

This checks ALL required variables and tells you exactly what's missing.

### Method 2: Add to Your Workflow

Create a startup routine:

```bash
# 1. Check environment
npm run check-env

# 2. If all checks pass, start servers
# Terminal 1:
cd backend && npm run dev

# Terminal 2:
npm run dev
```

### Method 3: Create a Startup Script

Add to your root `package.json`:

```json
"scripts": {
  "dev:all": "npm run check-env && concurrently \"npm run dev\" \"cd backend && npm run dev\""
}
```

Then just run:
```bash
npm run dev:all
```

---

## 🔧 Troubleshooting

### "supabaseKey is required" Error

**Problem:** `SUPABASE_SERVICE_ROLE_KEY` is missing in `backend/.env`

**Solution:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the **service_role** key (⚠️ keep it secret!)
5. Add to `backend/.env`: `SUPABASE_SERVICE_ROLE_KEY=your_key_here`

### "Stripe key invalid" Error

**Problem:** Stripe key is missing or incorrect format

**Solution:**
1. Frontend: Check `.env` has `VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...`
2. Backend: Check `backend/.env` has `STRIPE_SECRET_KEY=sk_test_...`
3. Validate: `npm run validate-stripe`

### Backend Won't Start

**Problem:** Missing environment variables

**Solution:**
```bash
# Check what's missing
npm run check-env

# Fix the missing variables, then restart
cd backend && npm run dev
```

---

## 📚 Quick Reference

### Validation Commands

```bash
# Check ALL environment variables
npm run check-env

# Check ONLY Stripe configuration
npm run validate-stripe
```

### Starting the Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
npm run dev
```

### Getting Your Keys

| Service | Dashboard URL | What You Need |
|---------|--------------|---------------|
| Supabase | https://supabase.com/dashboard | URL, Anon Key, Service Role Key |
| Stripe | https://dashboard.stripe.com/apikeys | Publishable Key, Secret Key |

---

## ✅ Setup Verification

After setting up all environment variables, verify everything works:

1. **Run validation:**
   ```bash
   npm run check-env
   ```
   ✅ Should show: "All required environment variables are set!"

2. **Test Stripe integration:**
   ```bash
   npm run validate-stripe
   ```
   ✅ Should show: "All checks passed!"

3. **Start servers:**
   - Backend should start without errors
   - Frontend should load at http://localhost:5173

4. **Test in browser:**
   - Open http://localhost:5173
   - Try a test payment with card: `4242 4242 4242 4242`

---

## 🆘 Getting Help

If you encounter issues:

1. Run `npm run check-env` to see what's missing
2. Check this guide for the specific error
3. Verify your keys are from the correct dashboard (test vs live mode)
4. Ensure both `.env` files exist and have correct permissions

**Common Issues:**
- ❌ "File not found" → Create the `.env` file
- ❌ "Key is empty" → Add the missing key value
- ❌ "Permission denied" → Check file permissions: `chmod 600 .env`
- ❌ "Invalid key format" → Verify you copied the complete key

---

**Last Updated:** 2026-02-03
**Platform:** Àpínlẹ̀rọ SaaS MVP
