# Stripe Security Setup - Complete Guide

## Security Status: ✅ READY

All security measures are now in place! You can safely add Stripe keys.

---

## 🔒 Security Features Enabled

### 1. **File-Level Security**
- ✅ `.env` files are in `.gitignore` (won't be committed)
- ✅ File permissions set to `600` (owner read/write only)
- ✅ Separate `.env` files for frontend and backend

### 2. **Database-Level Security**
- ✅ **Row Level Security (RLS)** enabled on all tables
- ✅ **Stripe keys encrypted** using AES-256 encryption
- ✅ **Automatic encryption** on save (trigger-based)
- ✅ **Audit logging** for all key access
- ✅ Secret keys NEVER exposed to frontend

### 3. **Access Control**
- ✅ Customers can only see their own data
- ✅ Business owners can only access their business
- ✅ Service role (backend) has controlled access
- ✅ Frontend has NO access to secret keys

---

## 📋 How to Add Stripe Keys Safely

### Step 1: Get Keys from Isha Treat

Ask them to provide both keys from their Stripe Dashboard:
- **Publishable Key**: `pk_test_...` (for testing) or `pk_live_...` (production)
- **Secret Key**: `sk_test_...` (for testing) or `sk_live_...` (production)

### Step 2: Add Publishable Key to Frontend

**File**: `/Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/.env`

```bash
# Replace the empty value with the key from Isha Treat
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXX
```

### Step 3: Add Secret Key to Backend

**File**: `/Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/backend/.env`

```bash
# Replace the empty value with the SECRET key from Isha Treat
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXX
```

### Step 4: Enable Stripe Payments

In the frontend `.env` file, change:
```bash
VITE_ENABLE_STRIPE_PAYMENTS=true
```

### Step 5: Restart the Application

```bash
# In the project directory
npm run dev

# In a separate terminal, start the backend
cd backend
npm start
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep test keys (`pk_test_*`, `sk_test_*`) during development
- Test thoroughly before switching to live keys
- Use the backend API for all payment processing
- Check that `.env` is in `.gitignore`
- Store production keys in Vercel/Railway environment variables

### ❌ DON'T:
- Never commit `.env` files to git
- Never share secret keys (`sk_*`) with anyone
- Never use secret keys in frontend code
- Never log or display secret keys
- Never store keys in plaintext in the database (auto-encrypted)

---

## 🔐 How the Encryption Works

When you add a Stripe secret key to the database:

1. **Automatic Detection**: System detects keys starting with `sk_`
2. **Encryption**: Key is encrypted using AES-256 before saving
3. **Storage**: Only encrypted version is stored in database
4. **Decryption**: Backend can decrypt when needed for payments
5. **Logging**: All access is logged in `stripe_key_access_log` table

**Example**:
```sql
-- When you save: sk_test_abc123
-- Database stores: WxZlbmNyeXB0ZWRfZGF0YV9oZXJl...

-- Frontend queries the database:
-- Result: NULL (cannot access encrypted keys)

-- Backend (service_role) queries:
-- Result: sk_test_abc123 (decrypted on-the-fly)
```

---

## 🧪 Testing the Setup

### Test 1: Verify File Permissions
```bash
ls -la /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/.env
ls -la /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project/backend/.env
```
Expected: `-rw-------` (600 permissions)

### Test 2: Verify .gitignore
```bash
cd /Users/user/Documents/Lazrap/SaaS/Apinlero/Apinlero_MVP/project
git status
```
Expected: `.env` files should NOT appear in the list

### Test 3: Test Payment Processing
Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- Any future expiry date (e.g., 12/34)
- Any 3-digit CVC

---

## 🚀 Production Deployment Checklist

Before going live with real customer payments:

### 1. Switch to Live Keys
- [ ] Get live keys from Isha Treat (`pk_live_*`, `sk_live_*`)
- [ ] Add to production environment variables (NOT `.env` files)
- [ ] Generate new encryption key: `openssl rand -hex 32`

### 2. Environment Variables (Vercel/Railway)
Set these in your deployment platform dashboard:

**Frontend (Vercel)**:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_XXXXX
VITE_ENABLE_STRIPE_PAYMENTS=true
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_anon_key>
```

**Backend (Railway)**:
```
STRIPE_SECRET_KEY=sk_live_XXXXX
SUPABASE_URL=<your_supabase_url>
SUPABASE_SERVICE_ROLE_KEY=<your_service_key>
NODE_ENV=production
```

### 3. Stripe Webhook Setup
- [ ] Go to Stripe Dashboard → Developers → Webhooks
- [ ] Add endpoint: `https://your-backend.railway.app/webhook/stripe`
- [ ] Select events: `payment_intent.succeeded`, `payment_intent.failed`
- [ ] Copy webhook secret (`whsec_*`) to backend env

### 4. Security Verification
- [ ] RLS policies enabled (check Supabase dashboard)
- [ ] Test customer A cannot see customer B's orders
- [ ] Verify secret keys are encrypted in database
- [ ] Check that frontend cannot access `stripe_secret_key_encrypted` column

---

## 📞 Support

If you need help:
1. Check the Stripe Dashboard for payment logs
2. Check backend logs for error messages
3. Verify all environment variables are set correctly
4. Test with Stripe test cards first before using real cards

---

## 📝 Files Modified

- ✅ [.env](/.env) - Added Stripe publishable key placeholder
- ✅ [backend/.env](/backend/.env) - Created with Stripe secret key placeholder
- ✅ Both files secured with 600 permissions
- ✅ RLS policies already applied (migration: `20260203000001_security_rls_policies.sql`)
- ✅ Encryption enabled (migration: `20260127010000_add_stripe_encryption.sql`)

---

**Status**: 🟢 Ready to accept Stripe keys safely!

**Next Step**: Get the Stripe API keys from Isha Treat and add them to the `.env` files as described above.
