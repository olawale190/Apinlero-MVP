# 🚀 Production Deployment Guide - Àpínlẹ̀rọ MVP

## Overview

This guide will walk you through deploying your Àpínlẹ̀rọ MVP to production for Isha's Treat & Groceries. Estimated time: 30-45 minutes.

## 📋 Pre-Deployment Checklist

### 1. Database Setup (15 minutes)

#### Step 1.1: Run Production SQL Script

1. Go to https://supabase.com/dashboard
2. Select your project: `***REMOVED***.supabase.co`
3. Click **SQL Editor** in left sidebar
4. Click **+ New query**
5. Open `supabase-production-setup.sql` from your project folder
6. Copy **ALL** the content (Cmd+A, Cmd+C)
7. Paste into Supabase SQL Editor
8. Click **RUN** button (or press Cmd+Enter)
9. Wait for completion (30-60 seconds)
10. Verify you see: ✓ PRODUCTION DATABASE SETUP COMPLETE!

#### Step 1.2: Verify Database Tables

1. Click **Table Editor** in left sidebar
2. Confirm these tables exist:
   - ✅ products (with image_url column)
   - ✅ orders (with payment_status column)
   - ✅ customers
   - ✅ payments
   - ✅ business_users
   - ✅ order_history

3. Check products table:
   - Click on `products` table
   - Verify all 15 products have `image_url` populated
   - Verify `stock_quantity` column exists

4. Check orders table:
   - Click on `orders` table
   - Should see 23 orders total
   - 15 orders from today
   - Mix of statuses: Delivered, Confirmed, Pending

#### Step 1.3: Test RLS Policies

1. Go to **Authentication** → **Policies**
2. Verify RLS is enabled (green checkmark) on:
   - products
   - orders
   - customers
   - payments
   - business_users

### 2. Environment Variables (5 minutes)

#### Step 2.1: Current Environment

Your `.env` file currently has:

```env
VITE_SUPABASE_URL=https://***REMOVED***.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ These are correct for production!

#### Step 2.2: Add Stripe (Optional)

If you want to enable card payments:

1. Go to https://stripe.com/register
2. Create account (UK business)
3. Complete verification
4. Go to Dashboard → Developers → API keys
5. Copy **Publishable key** (starts with `pk_test_` for testing)
6. Add to `.env`:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**For MVP demo, you can skip Stripe and use Cash/Bank Transfer only.**

### 3. Local Testing (10 minutes)

#### Step 3.1: Start Dev Server

```bash
npm run dev
```

Visit http://localhost:5173

#### Step 3.2: Verification Checklist

Open the application and verify:

- [ ] **Dashboard loads** - No errors in console
- [ ] **AI Summary visible** - Shows colorful insight cards at top
- [ ] **Orders table** - Shows 15 orders for today
- [ ] **No "NaN Items"** - All orders show proper item counts (e.g., "3 items")
- [ ] **Product images** - All products have images (no placeholder boxes)
- [ ] **Order details expand** - Click an order to see details
- [ ] **Total revenue** - Shows £700+ for today
- [ ] **Channel distribution** - See mix of WhatsApp, Web, Phone, Walk-in

If any of these fail, check the troubleshooting section below.

### 4. GitHub Setup (5-10 minutes)

#### Step 4.1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `apinlero-mvp` (or your choice)
3. Description: "AI-powered order management platform for African & Caribbean groceries"
4. **IMPORTANT:** Select **Private** (don't make public yet)
5. Don't initialize with README (we already have one)
6. Click **Create repository**

#### Step 4.2: Push Code to GitHub

```bash
# Add all files to git
git add .

# Create first commit
git commit -m "Initial commit: Production-ready MVP for UKES application

- Multi-channel order management (WhatsApp, Web, Phone, Walk-in)
- AI-powered daily insights with visual analytics
- Stripe payment integration (Cash, Card, Bank Transfer)
- Enterprise security: RLS policies, input validation, XSS protection
- Customer management with purchase history tracking
- Comprehensive database schema with audit trails
- Production-ready with 23 sample orders for demo

Tech stack: React 18, TypeScript 5, Vite 5, Supabase, Stripe, Tailwind CSS
Live pilot customer: Isha's Treat & Groceries (South London)
Built for: UK Innovator Founder Visa (UKES endorsement)"

# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/apinlero-mvp.git

# Push to GitHub
git push -u origin main
```

If it asks for credentials:
- Username: Your GitHub username
- Password: Use a Personal Access Token (not your password)
  - Generate at: https://github.com/settings/tokens
  - Select: `repo` scope
  - Copy token and use as password

### 5. Production Deployment (10 minutes)

#### Option A: Deploy to Vercel (Recommended)

Vercel is free for hobby projects and works perfectly with Vite.

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? apinlero-mvp
# - Directory? ./
# - Override settings? No

# When complete, you'll get a URL like: https://apinlero-mvp.vercel.app
```

##### Add Environment Variables to Vercel:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:

| Name | Value |
|------|-------|
| `VITE_SUPABASE_URL` | `https://***REMOVED***.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Your anon key from `.env` |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe key (if using) |

5. Click **Save**
6. Go to **Deployments** → Click **⋯** → **Redeploy**

#### Option B: Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Build command: npm run build
# Publish directory: dist
```

Add environment variables in Netlify Dashboard → Site Settings → Environment Variables

#### Option C: Keep Local for Now

If you're just preparing for UKES submission, you can keep running locally:

```bash
npm run dev
```

Access at http://localhost:5173 for demos/screenshots.

## 📸 Taking Production Screenshots for UKES

### Screenshot Checklist

Before taking screenshots:

1. **Full Screen Mode:** Press F11 (or Cmd+Shift+F on Mac)
2. **Clean Browser:** Close all other tabs, hide bookmarks bar
3. **Proper Data:** Refresh page to ensure all data loaded
4. **No Dev Tools:** Close any developer consoles
5. **Professional URL:** If possible, use production URL (not localhost)

### Required Screenshots (8-10 total):

1. **Dashboard with AI Summary** (homepage)
   - Shows AI Daily Insight with 4 colorful cards
   - Today's orders visible below
   - Highlight the AI section

2. **Orders Table - Full View**
   - Shows 15 orders
   - All columns visible (Time, Customer, Channel, Items, Total, Status)
   - Mix of statuses (Delivered, Confirmed, Pending)

3. **Order Details Expanded**
   - Click an order to expand
   - Shows item breakdown with prices
   - Customer details visible
   - Payment information

4. **Customer Storefront**
   - Navigate to customer view
   - Products with images displayed
   - Clean product grid

5. **Product Catalog**
   - All 15 products with images
   - Proper pricing
   - Categories visible

6. **Multi-Channel Orders**
   - Filter or sort to show different channels
   - WhatsApp, Web, Phone, Walk-in all represented

7. **Revenue Summary**
   - Close-up of today's revenue (£700+)
   - Order count
   - Average order value

8. **Mobile Responsive** (Optional)
   - Use browser dev tools to show mobile view
   - Demonstrates responsive design

### Screenshot Settings:

- **Resolution:** 1920x1080 minimum
- **Format:** PNG (better quality than JPG)
- **File naming:** `01_Dashboard_AI_Summary.png`, `02_Orders_Table.png`, etc.
- **Save location:** `/Users/user/Downloads/UKES_Screenshots/`

## 🐛 Troubleshooting

### Issue: "NaN Items" still showing

**Solution:**
```bash
# Hard refresh browser
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

# Or clear browser cache and restart dev server
npm run dev
```

### Issue: Product images not loading

**Solution:**
1. Check Supabase SQL was run completely
2. Verify in Table Editor → products → image_url column has URLs
3. Check browser console for CORS errors
4. Try different image if Unsplash is blocked

### Issue: No orders showing

**Solution:**
1. Go to Supabase → Table Editor → orders
2. Check `created_at` column - should have recent dates
3. If dates are old, re-run the INSERT statements from SQL script
4. Verify RLS policies allow SELECT (should be: auth.role() = 'authenticated')

### Issue: Orders showing but details not expanding

**Solution:**
1. Check browser console for errors
2. Verify `items` column in orders table is JSONB format
3. Try: `SELECT items FROM orders LIMIT 1;` in SQL editor
4. Should return array like: `[{"product_name": "...", "quantity": 2, "price": 8.50}]`

### Issue: Git push rejected

**Solution:**
```bash
# If main branch doesn't exist, try master
git push -u origin master

# If authentication fails, use Personal Access Token
# Generate at: https://github.com/settings/tokens
```

### Issue: Vercel build fails

**Solution:**
1. Check build logs in Vercel dashboard
2. Most common: Missing environment variables
3. Go to Settings → Environment Variables
4. Add all three: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_STRIPE_PUBLISHABLE_KEY
5. Redeploy

### Issue: Database connection error

**Solution:**
1. Verify Supabase project is not paused (free tier auto-pauses after inactivity)
2. Check Project Settings → General → Project is active
3. Verify URL in .env matches Project Settings → API → Project URL
4. Check anon key matches Project Settings → API → Project API keys → anon public

## 🔒 Security Reminders

### Before Sharing GitHub Repository:

- [ ] `.env` is in `.gitignore` (✅ already done)
- [ ] No API keys committed to git
- [ ] Database passwords not in code
- [ ] Stripe secret keys not in frontend code

To verify:
```bash
git log --all --full-history --pretty=format: --name-only | grep .env
# Should return nothing (env file never committed)
```

### For UKES Reviewers:

If they request source code access:

1. **Add them as collaborator** (Settings → Manage access → Invite collaborator)
2. **Or create a private link** (not recommended for sensitive code)
3. **Or provide read-only demo access** to deployed site

Never make the repository public if it contains:
- Database credentials
- API keys
- Business logic you want to protect

## 📊 Post-Deployment Verification

After deployment, verify:

1. **Visit production URL**
2. **Test all features:**
   - [ ] Dashboard loads
   - [ ] AI summary displays
   - [ ] Orders table works
   - [ ] Order details expand
   - [ ] Product images load
   - [ ] No console errors

3. **Performance check:**
   - Run Lighthouse audit (Chrome DevTools)
   - Target: 90+ performance score
   - Target: 90+ accessibility score

4. **Mobile test:**
   - Open on actual phone or use dev tools
   - Verify responsive layout works

## 🎯 Success Criteria

Your deployment is successful when:

✅ Database has 23 orders (15 today, 5 yesterday, 3 from 2 days ago)
✅ All 15 products have images
✅ AI Summary shows 4 insight cards
✅ No "NaN" errors anywhere
✅ Today's revenue shows £700+
✅ Code pushed to GitHub (private repository)
✅ Production URL works (if deployed) OR localhost:5173 works perfectly
✅ All screenshots taken (8-10 high-quality PNGs)

## 📞 Support

If you encounter issues:

1. Check browser console for errors (F12 → Console tab)
2. Check Supabase logs (Dashboard → Logs)
3. Review this troubleshooting section
4. Search error messages online
5. Create GitHub issue in repository

## 🎉 You're Ready for UKES!

Once all checklist items are complete:

1. ✅ Database fully seeded with realistic data
2. ✅ Application running smoothly (local or production)
3. ✅ GitHub repository created and code pushed
4. ✅ Professional screenshots taken
5. ✅ All security measures in place

**Your MVP is production-ready for UKES submission!**

Next steps:
- Prepare testimonial from Isha's Treat
- Create annotated screenshot document
- Include GitHub repository link in application
- Prepare live demo for interview

Good luck with your UK Innovator Founder Visa application! 🚀
