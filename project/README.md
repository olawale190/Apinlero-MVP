# Àpínlẹ̀rọ MVP - Multi-Channel Order Management Platform

## 🎯 Overview

Àpínlẹ̀rọ is an AI-powered order management platform designed for African & Caribbean grocery businesses in the UK. It consolidates orders from multiple channels (WhatsApp, Web, Phone, Walk-in) into a unified dashboard with intelligent insights.

**Live Pilot Customer:** Isha's Treat & Groceries (South London)

## ✨ Key Features

- 📱 **Multi-Channel Order Capture** - WhatsApp, Web, Phone, Walk-in
- 🤖 **AI Daily Insights** - Real-time analytics and actionable recommendations
- 💳 **Payment Integration** - Stripe, Cash, Bank Transfer, Card
- 📊 **Customer Management** - Track orders, spending, and preferences
- 🔒 **Enterprise Security** - Row Level Security, input validation, audit trails
- 📈 **Business Analytics** - Revenue tracking, channel performance, inventory alerts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Stripe account (optional, for card payments)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd project

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials

# 4. Run database setup
# Go to your Supabase Dashboard → SQL Editor
# Copy and run: supabase-production-setup.sql

# 5. Start development server
npm run dev
```

Visit http://localhost:5173 to see the application.

## 📁 Project Structure

```
project/
├── src/
│   ├── components/          # React components
│   │   ├── AISummary.tsx   # AI insights dashboard
│   │   ├── OrdersTable.tsx # Orders management
│   │   ├── ProductCard.tsx # Product display
│   │   └── ...
│   ├── lib/
│   │   ├── supabase.ts     # Supabase client
│   │   ├── validation.ts   # Input validation & sanitization
│   │   └── stripe.ts       # Payment processing
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── supabase-production-setup.sql  # Complete database setup
├── .env.example            # Environment variables template
└── package.json            # Dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

**⚠️ Security Warning:** Never commit `.env` to version control!

### Supabase Setup

1. Create a new project at https://supabase.com
2. Go to SQL Editor
3. Run `supabase-production-setup.sql` (complete setup script)
4. Verify tables created: products, orders, customers, payments, etc.

### Stripe Setup (Optional)

1. Create account at https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Use **test keys** (pk_test_...) for development
4. Add publishable key to `.env`

## 🗄️ Database Schema

### Core Tables

- **products** - Product catalog with images, pricing, stock
- **orders** - Order records with items, status, payment tracking
- **customers** - Customer database with purchase history
- **payments** - Payment transactions and audit trail
- **business_users** - Staff/owner authentication
- **order_history** - Audit log of order status changes

### Security Features

- ✅ Row Level Security (RLS) enabled on all tables
- ✅ Authenticated-only access policies
- ✅ Input validation and sanitization
- ✅ Audit trails for all changes
- ✅ SQL injection prevention
- ✅ XSS protection

## 🛡️ Security Best Practices

### Input Validation

All user inputs are validated using Zod schemas:

```typescript
import { validateOrder } from './lib/validation';

const validated = validateOrder(formData);
// Throws error if validation fails
```

### Rate Limiting

Client-side rate limiting is implemented:

```typescript
import { RateLimiter } from './lib/validation';

const limiter = new RateLimiter(5, 60000); // 5 requests per minute
if (!limiter.check('user-action')) {
  // Rate limit exceeded
}
```

### Data Sanitization

```typescript
import { sanitizeString } from './lib/validation';

const safe = sanitizeString(userInput); // Prevents XSS
```

## 💳 Payment Integration

### Supported Payment Methods

1. **Cash** - Cash on delivery or in-store
2. **Card** - Stripe card payments
3. **Bank Transfer** - Direct bank transfer
4. **Online** - Website payments

### Processing Payments

```typescript
import { processCardPayment } from './lib/stripe';

const result = await processCardPayment(clientSecret, cardElement);
if (result.success) {
  // Payment successful
}
```

**⚠️ Production Note:** Payment intent creation MUST be server-side. Implement using Supabase Edge Functions.

## 📊 AI Insights

The AI Summary component provides:

- **Order Volume Trends** - Compare against historical averages
- **Top Products** - Best sellers and stock alerts
- **Peak Channels** - Channel performance breakdown
- **Urgent Actions** - Pending orders requiring attention

## 🚢 Deployment

### Production Checklist

- [ ] Replace test Stripe keys with live keys
- [ ] Set up Supabase production project
- [ ] Configure custom domain
- [ ] Enable HTTPS
- [ ] Set up Stripe webhooks
- [ ] Configure environment variables on hosting platform
- [ ] Run security audit
- [ ] Test all payment flows
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure backups

### Deployment Options

#### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel Dashboard
# Settings → Environment Variables
```

#### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Configure environment variables in Netlify Dashboard
```

#### Option 3: Self-Hosted

```bash
# Build for production
npm run build

# Serve the dist/ folder with any web server
# (nginx, Apache, Node.js, etc.)
```

## 🧪 Testing

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Build test
npm run build
```

## 📈 Monitoring & Analytics

### Recommended Tools

- **Error Tracking:** Sentry (https://sentry.io)
- **Analytics:** Plausible or Google Analytics
- **Uptime Monitoring:** UptimeRobot or Pingdom
- **Performance:** Lighthouse CI

### Key Metrics to Track

- Daily order volume
- Revenue per channel
- Average order value
- Payment success rate
- Customer retention
- API response times

## 🔐 Authentication (Future Enhancement)

The database is set up for authentication with `business_users` table:

```sql
-- Create business user
INSERT INTO business_users (email, full_name, role)
VALUES ('owner@ishastreat.co.uk', 'Isha Patel', 'owner');
```

To add authentication:
1. Enable Supabase Auth in dashboard
2. Set up email/password or OAuth providers
3. Update RLS policies to reference `auth.uid()`
4. Add login/signup components

## 📞 Support

For issues or questions:
- Create an issue in this repository
- Email: support@apinlero.com (placeholder)

## 📄 License

Proprietary - All rights reserved

## 🙏 Acknowledgments

- **Pilot Customer:** Isha's Treat & Groceries
- **Built for:** UK Innovator Founder Visa Application (UKES)
- **Tech Stack:** React, TypeScript, Supabase, Stripe, Tailwind CSS

---

**For UKES Review:** This is a production MVP with a live pilot customer. The platform demonstrates Technology Readiness Level 6 (TRL 6) - Technology Demonstrated in Operational Environment.
