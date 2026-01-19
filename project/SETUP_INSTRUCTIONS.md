# 🎯 Complete Setup Instructions - Àpínlẹ̀rọ MVP

## Quick Reference

**Time to complete:** 20-30 minutes
**Difficulty:** Beginner friendly
**Prerequisites:** Computer with internet, GitHub account (free)

---

## Step 1: Run the Production SQL Script (10 minutes)

### 1.1 Access Supabase Dashboard

1. Open your browser
2. Go to: https://supabase.com/dashboard
3. Sign in to your account
4. You should see your project: `***REMOVED***.supabase.co`

### 1.2 Open SQL Editor

1. In the left sidebar, click **SQL Editor**
2. Click the **+ New query** button
3. You'll see an empty text editor

### 1.3 Copy the SQL Script

1. On your computer, open this file: `supabase-production-setup.sql`
2. Select **ALL** content (Cmd+A on Mac, Ctrl+A on Windows)
3. Copy it (Cmd+C on Mac, Ctrl+C on Windows)

### 1.4 Run the Script

1. Go back to Supabase SQL Editor
2. Paste the content (Cmd+V on Mac, Ctrl+V on Windows)
3. Click the **RUN** button (or press Cmd+Enter / Ctrl+Enter)
4. Wait 30-60 seconds for it to complete
5. You should see results appear at the bottom
6. Look for the final message: `✓ PRODUCTION DATABASE SETUP COMPLETE!`

### 1.5 Verify Success

1. Click **Table Editor** in the left sidebar
2. You should see these tables:
   - business_users
   - customers
   - order_history
   - orders
   - payments
   - products

3. Click on **products** table
   - You should see 15 products
   - Each product should have an `image_url` (web address)

4. Click on **orders** table
   - You should see 23 orders
   - Orders have recent timestamps (today, yesterday, 2 days ago)

**✅ If you see all this, you're good! If not, see Troubleshooting section.**

---

## Step 2: Start the Application (5 minutes)

### 2.1 Open Terminal

**On Mac:**
- Press Cmd+Space
- Type "Terminal"
- Press Enter

**On Windows:**
- Press Windows key
- Type "Command Prompt" or "PowerShell"
- Press Enter

### 2.2 Navigate to Project Folder

```bash
cd /Users/user/Downloads/Apinlero_MVP/project
```

(On Windows, replace with your actual path, e.g., `cd C:\Users\YourName\Downloads\Apinlero_MVP\project`)

### 2.3 Start Development Server

```bash
npm run dev
```

You should see output like:

```
  VITE v5.4.2  ready in 523 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 2.4 Open in Browser

1. Open your web browser (Chrome recommended)
2. Go to: http://localhost:5173
3. The application should load

**✅ You should see the dashboard with AI Daily Insight at the top!**

---

## Step 3: Verify Everything Works (5 minutes)

### 3.1 Check the Dashboard

You should see:

1. **Top Section:** AI Daily Insight with 4 colored cards
   - Teal card: Order Volume Trend
   - Blue card: Top Product
   - Purple card: Peak Channel
   - Orange/Green card: Urgent Actions

2. **Main Section:** Orders table showing 15 orders for today

3. **All orders show proper item counts** like "3 items", "2 items"
   - **NOT** "NaN items" ❌

### 3.2 Test Order Details

1. **Click on any order row** in the table
2. The row should expand
3. You should see:
   - Order Details with item breakdown
   - Customer Information (name, address, phone)
   - Delivery Information
   - Payment status

4. **Click the row again** to collapse it

### 3.3 Check Product Images

1. Navigate to Products section (if available)
2. OR look at the order items
3. All products should have images (not placeholder boxes)

### 3.4 Check Numbers

Look at the AI Daily Insight:
- Today's orders: Should show 15
- Total revenue: Should show around £700+
- Channel breakdown: Mix of WhatsApp, Web, Phone, Walk-in

**✅ If all checks pass, you're ready!**

---

## Step 4: Push Code to GitHub (10 minutes)

### 4.1 Create GitHub Account (if needed)

1. Go to https://github.com/signup
2. Create a free account
3. Verify your email

### 4.2 Create New Repository

1. Go to https://github.com/new
2. Fill in details:
   - Repository name: `apinlero-mvp`
   - Description: `AI-powered order management for African & Caribbean groceries`
   - **IMPORTANT:** Select **Private** (don't make public)
   - Don't initialize with README
3. Click **Create repository**
4. You'll see a page with setup instructions

### 4.3 Push Your Code

In your terminal (same one from Step 2), run these commands one by one:

```bash
# Add all files to git
git add .

# Create your first commit
git commit -m "Initial commit: Production-ready MVP

- Multi-channel order management
- AI-powered insights
- Stripe payment integration
- Enterprise security (RLS, validation)
- Customer management
- 23 sample orders for demo

Live pilot: Isha's Treat & Groceries
Built for: UK Innovator Founder Visa (UKES)"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/apinlero-mvp.git

# Set branch name to main
git branch -M main

# Push to GitHub
git push -u origin main
```

When it asks for credentials:
- **Username:** Your GitHub username
- **Password:** Use a Personal Access Token (see below)

### 4.4 Create Personal Access Token

If git asks for password:

1. Go to: https://github.com/settings/tokens
2. Click **Generate new token** → **Generate new token (classic)**
3. Note: "Apinlero MVP access"
4. Expiration: 90 days
5. Select scopes: Check **repo** (full control)
6. Click **Generate token**
7. **COPY THE TOKEN** (you won't see it again!)
8. Use this token as your password when git asks

### 4.5 Verify Upload

1. Go to your GitHub repository page
2. You should see all your files uploaded
3. Check that `README.md` displays project information

**✅ Your code is now safely backed up on GitHub!**

---

## Step 5: Take Screenshots for UKES (10 minutes)

### 5.1 Prepare Your Browser

1. Open Chrome or Firefox
2. Press F11 (or Cmd+Shift+F on Mac) for full-screen mode
3. Close all other tabs
4. Hide bookmarks bar (Cmd+Shift+B or Ctrl+Shift+B)
5. Go to http://localhost:5173

### 5.2 Take Required Screenshots

Create a folder first:
```bash
mkdir -p /Users/user/Downloads/UKES_Screenshots
```

Then take these screenshots:

#### Screenshot 1: Dashboard with AI Summary
- Shows AI Daily Insight prominently
- Save as: `01_Dashboard_AI_Summary.png`

#### Screenshot 2: Orders Table
- Shows all 15 orders for today
- Save as: `02_Orders_Table.png`

#### Screenshot 3: Order Details Expanded
- Click an order to expand
- Shows item breakdown
- Save as: `03_Order_Details.png`

#### Screenshot 4: Customer Storefront
- Shows product catalog with images
- Save as: `04_Product_Catalog.png`

#### Screenshot 5: Multi-Channel View
- Highlight different channel badges
- Save as: `05_Multi_Channel_Orders.png`

#### Screenshot 6: Revenue Summary
- Close-up of AI insights showing revenue
- Save as: `06_Revenue_Analytics.png`

### 5.3 Screenshot Settings

- **Format:** PNG (better quality)
- **Resolution:** Minimum 1920x1080
- **Quality:** High
- **Content:** No development tools visible

**How to take screenshots:**

**Mac:**
- Cmd+Shift+4 → Select area
- OR Cmd+Shift+3 → Full screen

**Windows:**
- Snipping Tool (search in Start menu)
- OR Windows+Shift+S

---

## Troubleshooting

### SQL Script Issues

**Problem:** Error when running SQL script

**Solution:**
1. Make sure you copied the ENTIRE script
2. Check Supabase project is active (not paused)
3. Try running in smaller sections if needed
4. Check for red error messages and read them

**Problem:** Tables exist but no data

**Solution:**
1. Check the INSERT statements ran successfully
2. Go to Table Editor → orders → Should see 23 rows
3. If empty, re-run just the INSERT sections of the SQL

### Application Not Loading

**Problem:** "Cannot GET /" or blank page

**Solution:**
1. Check terminal for errors
2. Make sure `npm run dev` is still running
3. Try `npm install` again
4. Check `.env` file exists and has correct values

**Problem:** "NaN Items" showing

**Solution:**
1. Hard refresh: Cmd+Shift+R or Ctrl+Shift+R
2. Clear browser cache
3. Check that SQL script fully completed
4. Verify `items` column in orders table is JSONB format

**Problem:** No product images

**Solution:**
1. Check SQL script ran completely
2. Verify products table has `image_url` column
3. Check internet connection (images load from Unsplash)
4. Try different browser

### Git/GitHub Issues

**Problem:** `git: command not found`

**Solution:**
1. Install Git: https://git-scm.com/downloads
2. Restart terminal after installation
3. Try `git --version` to verify

**Problem:** Authentication failed when pushing

**Solution:**
1. Create Personal Access Token (see Step 4.4)
2. Use token as password, NOT your GitHub password
3. Make sure username is correct

**Problem:** `remote origin already exists`

**Solution:**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/apinlero-mvp.git
git push -u origin main
```

---

## Success Checklist

Before moving on, verify:

- [ ] ✅ SQL script ran successfully in Supabase
- [ ] ✅ 6 tables created (products, orders, customers, payments, business_users, order_history)
- [ ] ✅ 23 orders in database (15 today, 5 yesterday, 3 from 2 days ago)
- [ ] ✅ 15 products with images
- [ ] ✅ Application running at http://localhost:5173
- [ ] ✅ AI Daily Insight showing 4 colored cards
- [ ] ✅ No "NaN Items" errors
- [ ] ✅ Order details expand correctly
- [ ] ✅ Today's revenue shows £700+
- [ ] ✅ Code pushed to GitHub private repository
- [ ] ✅ 6-10 screenshots taken and saved

---

## Next Steps

1. **Review documentation:**
   - `README.md` - Project overview
   - `PRODUCTION_DEPLOYMENT.md` - Deployment guide
   - `USER_GUIDE.md` - How to use the system

2. **Prepare for UKES submission:**
   - Gather testimonial from Isha's Treat
   - Create annotated screenshot document
   - Include GitHub repository link in application

3. **Optional enhancements:**
   - Deploy to Vercel/Netlify for public URL
   - Set up Stripe for card payments
   - Add custom domain

---

## Getting Help

If you're stuck:

1. **Check the Troubleshooting section** above
2. **Review error messages** carefully
3. **Search online** for specific errors
4. **Check browser console** (F12 → Console tab)
5. **Contact support:** [Your contact info]

---

## Congratulations! 🎉

You now have a production-ready MVP for your UKES application!

**What you've built:**
- ✅ Fully functional order management system
- ✅ AI-powered analytics and insights
- ✅ Multi-channel order capture
- ✅ Enterprise-grade security
- ✅ Professional presentation for UKES
- ✅ Source code safely on GitHub

**You're ready for your UK Innovator Founder Visa application!**

Good luck! 🚀
