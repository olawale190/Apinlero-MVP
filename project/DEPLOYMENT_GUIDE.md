# Àpínlẹ̀rọ MVP - Deployment Guide for Isha's Treat & Groceries

## Quick Start for Pilot Testing

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (already configured)

### 1. Install Dependencies
```bash
cd /Users/user/Downloads/Apinlero_MVP/project
npm install
```

### 2. Run Database Migrations
Go to your Supabase Dashboard and run the SQL migrations in order:
1. `supabase/migrations/20251208071120_create_orders_and_products_tables.sql`
2. `supabase/migrations/20251208220433_add_missing_order_columns.sql`
3. `supabase/migrations/20251218000000_add_product_columns_and_update_data.sql`

### 3. Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### 4. Production Build
```bash
npm run build
npm run preview
```

---

## Application Views

### Customer Storefront (Default)
- URL: `http://localhost:5173`
- Features:
  - Browse products by category
  - Search products
  - Add to cart
  - Checkout with delivery/collection options
  - Order confirmation

### Owner Dashboard
- Access: Click the dashboard icon in the storefront header, or go directly to login
- Features:
  - AI Daily Insights (order trends, top products, urgent actions)
  - Live statistics (orders today, revenue, pending orders, top channel)
  - Order management with status updates
  - Manual order entry for WhatsApp/Phone orders
  - Real-time updates

### Login Options
1. **Demo Mode** (for pilot testing): Click "Demo Login" - no credentials needed
2. **Full Authentication**: Use Supabase email/password authentication

---

## Testing Checklist for Isha's Treat

### Customer Flow Testing
- [ ] Browse products on storefront
- [ ] Filter by category
- [ ] Search for products
- [ ] Add items to cart
- [ ] View cart and modify quantities
- [ ] Complete checkout (delivery option)
- [ ] Complete checkout (collection option)
- [ ] Verify order confirmation page

### Owner Dashboard Testing
- [ ] Access dashboard via Demo Login
- [ ] View AI Daily Insights
- [ ] Check stats cards update correctly
- [ ] View today's orders
- [ ] Change order status (Pending → Confirmed → Delivered)
- [ ] Expand order to see details
- [ ] Create manual order (WhatsApp channel)
- [ ] Verify new orders appear in table

### Real-time Testing
- [ ] Open storefront in one browser
- [ ] Open dashboard in another browser
- [ ] Place order on storefront
- [ ] Verify order appears in dashboard immediately

---

## Deployment to Production

### Option 1: Vercel (Recommended)
```bash
npm install -g vercel
vercel
```
Set environment variables in Vercel dashboard.

### Option 2: Netlify
```bash
npm run build
# Upload dist folder to Netlify
```

### Option 3: Custom Server
```bash
npm run build
# Serve the dist folder with any static file server
```

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | No (future) |

---

## Support Contacts

For pilot testing support:
- Technical issues: Check console for errors
- Database issues: Check Supabase dashboard logs
- Feature requests: Document and share with development team

---

## What's Included in MVP

### ✅ Implemented
- Customer storefront with product catalog
- Shopping cart with quantity management
- Checkout flow (delivery + collection)
- Order confirmation
- Owner dashboard with AI insights
- Real-time order management
- Multi-channel order entry (WhatsApp, Web, Phone, Walk-in)
- Status management (Pending, Confirmed, Delivered)
- Demo authentication for pilot testing

### 🔜 Coming Soon (Post-Pilot)
- WhatsApp Business API integration
- Full Stripe payment processing
- Email/SMS notifications
- Advanced analytics
- Mobile native apps

---

Last Updated: December 2024
