# Àpínlẹ̀rọ Platform Architecture

## 🏗️ Platform Overview

**Àpínlẹ̀rọ is a B2B SaaS platform** that enables ethnic grocery businesses to sell online to their customers. Think of it like Shopify or Square for ethnic grocery stores.

### ⚠️ IMPORTANT: Multi-Tenant Architecture

This platform serves **THREE different audiences** with **THREE different experiences**:

1. **Prospective Business Owners** → Marketing landing page
2. **Business Owners (Your Clients)** → Admin dashboard
3. **End Customers** → Individual business storefronts

---

## 🎯 The Three Portals

### 1️⃣ Marketing Landing Page (Root Domain)

**Who uses it:** Prospective business owners who want to sign up for Àpínlẹ̀rọ

**URLs:**
- **Production:** `https://apinlero.com`
- **Development:** `http://localhost:5173`

**Purpose:**
- Explains what Àpínlẹ̀rọ is
- Shows pricing and features
- Business signup/registration
- Platform information

**Key Pages:**
- `/` - Landing page
- `/signup` - Business registration
- `/pricing` - Pricing plans
- `/features` - Platform features

---

### 2️⃣ Business Admin Dashboard (App Subdomain)

**Who uses it:** Business owners (your clients) who manage their stores

**URLs:**
- **Production:** `https://app.apinlero.com`
- **Development:** `http://localhost:5173/app`

**Purpose:**
- Manage products and inventory
- View and process orders
- Track revenue and analytics
- Configure Stripe payment settings
- Manage customer data
- Send WhatsApp promotions
- Business settings

**Key Features:**
- **Inventory Management** - Add/edit products, categories
- **Order Management** - View orders, update status
- **Analytics Dashboard** - Sales metrics, trends
- **Stripe Settings** - Configure payment processing
- **Customer Management** - View customer profiles
- **WhatsApp Integration** - Send bulk messages
- **Settings** - Business profile, API keys

**Example Business:**
- Business name: "Isha's Treat"
- Admin logs in at: `https://app.apinlero.com`
- Manages their store inventory and orders

---

### 3️⃣ Customer Storefronts (Business Subdomains)

**Who uses it:** End customers shopping from a specific business

**URLs:**
- **Production:** `https://{business-slug}.apinlero.com`
  - Example: `https://ishas-treat.apinlero.com`
- **Development:** `http://localhost:5173/store/{business-slug}`
  - Example: `http://localhost:5173/store/ishas-treat`

**Purpose:**
- Browse products from that specific business
- Add items to cart
- Checkout and pay (via Stripe)
- Track orders
- View order history
- Manage delivery addresses

**Key Features:**
- **Shop/Browse** - Product catalog with search and filters
- **Cart** - Shopping cart (persisted in localStorage)
- **Checkout** - Delivery details and payment
- **Payment** - Stripe card payment or bank transfer
- **Order Confirmation** - Email and WhatsApp notifications
- **Account** - Order history, saved addresses, wishlist

**Example Customer Journey:**
1. Customer visits `https://ishas-treat.apinlero.com`
2. Browses Isha's Treat's products
3. Adds items to cart
4. Checks out and pays with card (Stripe)
5. Receives order confirmation
6. Isha's Treat fulfills the order

---

## 🔑 Key Architectural Concepts

### Multi-Tenancy

Each business is a **tenant** with:
- Their own products (filtered by `business_id`)
- Their own orders (tagged with `business_id`)
- Their own customers
- Their own Stripe account credentials (encrypted)
- Their own branded storefront subdomain

**Data Isolation:**
- All core database tables include `business_id` foreign key
- Row-Level Security (RLS) policies ensure data privacy
- Orders and payments are isolated per business

### Subdomain Routing

**Production:**
```
apinlero.com                    → Marketing landing page
app.apinlero.com                → Business admin dashboard
ishas-treat.apinlero.com        → Isha's Treat customer storefront
another-business.apinlero.com   → Another Business customer storefront
```

**Development (localhost):**
```
localhost:5173                  → Marketing landing page
localhost:5173/app              → Business admin dashboard
localhost:5173/store/ishas-treat     → Isha's Treat customer storefront
localhost:5173/store/another-business → Another Business customer storefront
```

### Business Slug

Each business has a unique **slug** (URL-friendly identifier):
- Example: "Isha's Treat" → slug: `ishas-treat`
- Stored in `businesses` table
- Used to route to correct storefront
- Appears in subdomain or path

---

## 💳 Payment Architecture

### Per-Business Stripe Accounts

**Critical:** Each business uses **their own Stripe account**, not a shared platform account.

**How it works:**

1. **Business Setup:**
   - Business owner creates Stripe account
   - Gets Stripe API keys (publishable & secret)
   - Enters keys in Admin Dashboard → Settings → Stripe

2. **Keys Storage:**
   - `stripe_publishable_key` - Stored in plaintext (safe for frontend)
   - `stripe_secret_key_encrypted` - Encrypted with AES-256-GCM
   - Keys stored in `businesses` table

3. **Payment Flow:**
   - Customer shops at `{business}.apinlero.com`
   - At checkout, frontend loads **that business's** publishable key
   - Backend creates payment intent using **that business's** secret key
   - Money goes directly to **that business's** Stripe account

4. **Isolation:**
   - Business A's payments go to their Stripe account
   - Business B's payments go to their Stripe account
   - Platform never holds funds

### Payment Intent Creation

**Server-Side Flow:**

```
1. Customer completes checkout form
   ↓
2. Frontend calls Supabase Edge Function: verify-order-total
   - Validates prices against database
   - Prevents price manipulation
   ↓
3. Frontend calls Supabase Edge Function: create-payment-intent
   - Fetches business's encrypted Stripe secret key
   - Decrypts key server-side
   - Creates Stripe Payment Intent using business's account
   - Returns clientSecret to frontend
   ↓
4. Frontend renders Stripe Payment Form
   - Customer enters card details
   - Stripe processes payment
   ↓
5. Stripe sends webhook to stripe-webhook Edge Function
   - Updates order status to "Confirmed"
   - Sends WhatsApp confirmation
```

---

## 🗂️ Database Schema

### Core Tables

| Table | Primary Key | business_id | Purpose |
|-------|------------|-------------|---------|
| `businesses` | `id` (uuid) | N/A | Tenant registry |
| `products` | `id` (uuid) | FK | Product catalog per business |
| `orders` | `id` (uuid) | FK | Customer orders |
| `categories` | `id` (uuid) | FK | Product categories |
| `sub_categories` | `id` (uuid) | FK | Product subcategories |
| `customer_profiles` | `id` (uuid) | FK | Customer data |
| `payments` | `id` (uuid) | Via orders | Payment records |

### businesses Table

```sql
businesses (
  id uuid PRIMARY KEY,
  name text,                           -- "Isha's Treat"
  slug text UNIQUE,                    -- "ishas-treat"
  owner_email text,
  phone text,
  stripe_publishable_key text,         -- pk_test_... or pk_live_...
  stripe_secret_key_encrypted text,    -- Encrypted sk_test_... or sk_live_...
  stripe_account_id text,              -- acct_...
  stripe_webhook_secret text,
  stripe_connected_at timestamptz,
  is_active boolean DEFAULT true,
  subscription_status text,            -- 'trial', 'active', 'expired'
  created_at timestamptz
)
```

### orders Table

```sql
orders (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses(id),  -- CRITICAL: Links order to business
  customer_name text,
  email text,
  phone_number text,
  delivery_address text,
  items jsonb,                         -- [{product_name, quantity, price}, ...]
  subtotal numeric,
  delivery_fee numeric,
  tax numeric,
  total numeric,
  status text,                         -- 'Pending', 'Confirmed', 'Shipped', 'Delivered'
  payment_status text,                 -- 'Pending', 'Paid', 'Failed', 'Refunded'
  payment_method text,                 -- 'card', 'bank_transfer'
  payment_intent_id text,              -- Stripe payment intent ID (pi_...)
  created_at timestamptz
)
```

---

## 🧪 Testing & Development

### Testing the Customer Storefront

**DO NOT test on the admin dashboard!** Customers shop on storefronts.

**To test Stripe payments:**

1. **Navigate to a customer storefront:**
   ```
   http://localhost:5173/store/ishas-treat
   ```

2. **Browse products** and add items to cart

3. **Go to checkout** (click cart icon or "Checkout" button)

4. **Fill out customer details:**
   - Name, email, phone
   - Delivery address

5. **Select payment method:** Card Payment (Stripe)

6. **Use Stripe test card:**
   ```
   Card Number: 4242 4242 4242 4242
   Expiry: 12/34 (any future date)
   CVC: 123
   ZIP: 12345
   ```

7. **Complete payment** and verify order confirmation

8. **Check Stripe Dashboard:**
   - Visit: https://dashboard.stripe.com/test/payments
   - Verify payment appears

### Testing the Admin Dashboard

**To test business owner features:**

1. **Navigate to admin portal:**
   ```
   http://localhost:5173/app
   ```

2. **Login as business owner** (Isha's Treat credentials)

3. **Test features:**
   - Add/edit products
   - View orders
   - Configure Stripe settings
   - Send WhatsApp promotions

### Common Mistakes to Avoid

❌ **WRONG:** Testing payment on `http://localhost:5173` (landing page)
✅ **CORRECT:** Testing payment on `http://localhost:5173/store/ishas-treat` (storefront)

❌ **WRONG:** Testing payment on `http://localhost:5173/app` (admin dashboard)
✅ **CORRECT:** Testing payment on `http://localhost:5173/store/ishas-treat` (storefront)

❌ **WRONG:** Assuming all businesses share one Stripe account
✅ **CORRECT:** Each business has their own Stripe account

---

## 📂 Key Files Reference

### Routing & Context
- [src/App.tsx](../src/App.tsx) - Main router with subdomain logic
- [src/contexts/BusinessContext.tsx](../src/contexts/BusinessContext.tsx) - Business context provider
- [src/lib/business-resolver.ts](../src/lib/business-resolver.ts) - Subdomain and business resolution

### Customer Storefront
- [src/pages/Shop.tsx](../src/pages/Shop.tsx) - Product browsing
- [src/pages/Checkout.tsx](../src/pages/Checkout.tsx) - Checkout and payment
- [src/components/StripePaymentForm.tsx](../src/components/StripePaymentForm.tsx) - Stripe payment UI

### Business Admin
- [src/pages/Dashboard.tsx](../src/pages/Dashboard.tsx) - Admin dashboard
- [src/pages/StripeSettings.tsx](../src/pages/StripeSettings.tsx) - Stripe configuration

### Payment Processing
- [src/lib/stripe.ts](../src/lib/stripe.ts) - Stripe utility functions
- [supabase/functions/verify-order-total/index.ts](../supabase/functions/verify-order-total/index.ts) - Price verification
- [supabase/functions/create-payment-intent/index.ts](../supabase/functions/create-payment-intent/index.ts) - Payment intent creation
- [supabase/functions/stripe-webhook/index.ts](../supabase/functions/stripe-webhook/index.ts) - Webhook handler

### Database
- [database-schema-multitenant.sql](../database-schema-multitenant.sql) - Complete schema
- [supabase/migrations/](../supabase/migrations/) - Migration files

---

## 🚀 Deployment

### Production URLs

| Service | URL |
|---------|-----|
| Marketing Site | `https://apinlero.com` |
| Admin Dashboard | `https://app.apinlero.com` |
| Customer Storefront | `https://{business-slug}.apinlero.com` |

### Deployment Platforms

- **Frontend:** Vercel
- **Backend (WhatsApp Bot):** Railway
- **Database:** Supabase (PostgreSQL)
- **Edge Functions:** Supabase Edge Functions
- **File Storage:** Supabase Storage

### Environment Variables

See [ENVIRONMENT_SETUP.md](./ENVIRONMENT_SETUP.md) for complete environment configuration.

**Important:**
- Frontend `.env` has `VITE_STRIPE_PUBLISHABLE_KEY` (one key for demo)
- In production, publishable key is loaded per business from database
- Secret keys are NEVER exposed to frontend

---

## 🔐 Security

### Key Security Measures

1. **Server-Side Price Verification**
   - Prices recalculated server-side before payment
   - Prevents client-side price manipulation

2. **Encrypted Stripe Keys**
   - Secret keys encrypted with AES-256-GCM
   - Decryption only in Edge Functions
   - Never sent to frontend

3. **CORS Protection**
   - Edge functions validate origin
   - Only allow apinlero.com subdomains

4. **Authentication & Authorization**
   - Supabase Auth required for admin functions
   - Business owners can only access their own data

5. **Multi-Tenant Isolation**
   - All queries filtered by business_id
   - Row-Level Security policies enforce access control

6. **Idempotency**
   - Payment intents use orderId as idempotency key
   - Prevents duplicate charges on retry

---

## 📚 For Developers

### When Building New Features

**Always consider:**

1. **Which portal is this for?**
   - Marketing site? Admin dashboard? Customer storefront?

2. **Is it multi-tenant?**
   - Does it need a business_id foreign key?
   - Should it be filtered per business?

3. **Who accesses it?**
   - Business owners? Customers? Platform admins?

4. **What's the route?**
   - Root domain? app subdomain? Business subdomain?

### Adding a New Customer Feature

Example: Adding a "Product Reviews" feature

1. **Database:**
   ```sql
   CREATE TABLE reviews (
     id uuid PRIMARY KEY,
     business_id uuid REFERENCES businesses(id),  -- Multi-tenant!
     product_id uuid REFERENCES products(id),
     customer_name text,
     rating integer,
     comment text,
     created_at timestamptz
   );
   ```

2. **Component Location:**
   - Place in `src/components/` or `src/pages/`
   - Import in `Shop.tsx` or product detail page

3. **Route:**
   - Customer-facing, so appears on storefront
   - URL: `{business}.apinlero.com/product/{id}#reviews`

4. **Data Query:**
   ```typescript
   const { data } = await supabase
     .from('reviews')
     .select('*')
     .eq('business_id', businessId)  // Filter by business!
     .eq('product_id', productId)
   ```

---

## 🎓 Quick Reference

### I want to test customer payments
→ Go to `http://localhost:5173/store/ishas-treat`

### I want to test the admin dashboard
→ Go to `http://localhost:5173/app`

### I want to add a product
→ Login to admin dashboard, go to Inventory tab

### I want to view orders
→ Login to admin dashboard, go to Overview tab

### I want to configure Stripe
→ Login to admin dashboard, go to Settings tab → Stripe Settings

### I want to test a payment
→ Go to storefront, add items to cart, checkout with test card `4242 4242 4242 4242`

### Where does the money go?
→ Directly to the business's Stripe account (not held by platform)

### Can I use the same Stripe account for all businesses?
→ No! Each business MUST have their own Stripe account for legal and accounting reasons

---

**Last Updated:** 2026-02-04
**Platform:** Àpínlẹ̀rọ SaaS MVP
**Architecture:** Multi-Tenant B2B SaaS
