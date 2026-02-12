# Apinlero MVP - Development Notes

This document tracks the development progress and architecture decisions for the Apinlero MVP project.

---

## Project Overview

**Apinlero** is a multi-tenant SaaS platform for ethnic grocery businesses in the UK, featuring:
- Multi-tenant storefront with subdomain routing (e.g., `ishas-treat.apinlero.com`)
- Business dashboard at `app.apinlero.com`
- WhatsApp ordering bot with AI-powered natural language processing
- Inventory management with barcode/QR scanning
- Multi-channel order processing (Web, WhatsApp, Phone)
- Stripe payments integration
- Email notifications via Resend
- Automated alerts and reporting via n8n

**Primary Use Case**: Isha's Treat - African grocery wholesale/retail business in the UK

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + TypeScript + Vite 7 |
| **Styling** | Tailwind CSS 3.4 |
| **Routing** | React Router DOM 7 |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth (Email + Google OAuth) |
| **Payments** | Stripe |
| **Email** | Resend API |
| **Hosting** | Vercel (Frontend), Railway (WhatsApp Bot) |
| **Automation** | n8n (workflows, emails, backups) |
| **WhatsApp** | Twilio WhatsApp API |
| **Knowledge Graph** | Neo4j Aura (product aliases) |
| **Testing** | Vitest + Testing Library |
| **Monitoring** | Sentry |

---

## Project Structure

```
Apinlero/
├── Apinlero_MVP/
│   ├── CLAUDE.md              # This file
│   ├── project/               # Main React frontend
│   │   ├── src/
│   │   │   ├── App.tsx        # Main app with routing
│   │   │   ├── main.tsx       # Entry point
│   │   │   ├── components/    # React components
│   │   │   │   ├── calendar/  # Calendar system
│   │   │   │   ├── landing/   # Landing page components
│   │   │   │   ├── platform/  # Platform marketing components
│   │   │   │   └── auth/      # Auth UI components
│   │   │   ├── pages/         # Page components
│   │   │   │   ├── account/   # Customer account pages
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Shop.tsx
│   │   │   │   ├── Checkout.tsx
│   │   │   │   └── ...
│   │   │   ├── contexts/      # React contexts
│   │   │   │   ├── AuthContext.tsx      # Customer auth
│   │   │   │   └── BusinessContext.tsx  # Multi-tenant business
│   │   │   ├── context/       # Legacy contexts
│   │   │   │   └── CartContext.tsx
│   │   │   ├── lib/           # Utility libraries
│   │   │   │   ├── supabase.ts
│   │   │   │   ├── stripe.ts
│   │   │   │   ├── email.ts
│   │   │   │   ├── storage.ts
│   │   │   │   ├── calendar.ts
│   │   │   │   └── business-resolver.ts
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── types/         # TypeScript types
│   │   │   └── config/        # App configuration
│   │   ├── api/               # Vercel serverless functions
│   │   │   ├── notify.js      # Order notifications
│   │   │   └── whatsapp.js    # WhatsApp webhooks
│   │   ├── backend/           # Express backend (legacy)
│   │   ├── supabase/          # Supabase config
│   │   ├── n8n-workflows/     # n8n workflow JSON files
│   │   ├── scripts/           # Utility scripts
│   │   └── *.sql              # Database migrations
│   └── whatsapp-bot/          # WhatsApp bot service
│       ├── src/
│       │   ├── server.js          # Express server
│       │   ├── message-handler.js # Message processing
│       │   ├── message-parser.js  # NLP parsing
│       │   ├── response-templates.js
│       │   ├── supabase-client.js
│       │   └── neo4j-matcher.js   # Product matching
│       └── __tests__/         # Jest tests
├── Documents/                 # Business documents
└── Assets/                    # Design assets
```

---

## Key Architectural Patterns

### Multi-Tenant Routing

The app uses subdomain-based routing for multi-tenancy:

1. **Root domain** (`apinlero.com`) - Landing page
2. **App subdomain** (`app.apinlero.com`) - Business dashboard
3. **Business subdomains** (`{slug}.apinlero.com`) - Customer storefronts

Routing logic in [App.tsx](Apinlero_MVP/project/src/App.tsx):
- `BusinessProvider` wraps the app for global business context
- `getCurrentSubdomain()` detects the current subdomain
- `getBusinessBySlug()` fetches business data from Supabase

### State Management

- **React Context** for global state:
  - `AuthContext` - Customer authentication state
  - `BusinessContext` - Current business/tenant context
  - `CartContext` - Shopping cart state

### Authentication

- **Supabase Auth** for both business owners and customers
- Email/password and Google OAuth supported
- Customer profiles stored in `customer_profiles` table
- Business owner auth separate from customer auth

### Database Design

Multi-tenant with `business_id` on all core tables:
- `businesses` - Tenant registry
- `products` - Product catalog (per business)
- `orders` - Customer orders
- `customer_profiles` - Customer accounts
- `categories` - Product categories
- `whatsapp_configs` - Per-business WhatsApp settings

---

## Development Commands

```bash
# Frontend (project/)
cd Apinlero_MVP/project
npm install
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Test UI
npm run typecheck    # TypeScript check

# WhatsApp Bot (whatsapp-bot/)
cd Apinlero_MVP/whatsapp-bot
npm install
npm run dev          # Start with hot reload
npm start            # Production start
npm test             # Run tests
```

---

## Environment Variables

### Frontend (project/.env)

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_...

# Email (Resend)
VITE_RESEND_API_KEY=re_...
VITE_FROM_EMAIL=noreply@apinlero.com

# n8n (optional)
VITE_N8N_WEBHOOK_URL=https://...

# Sentry (optional)
VITE_SENTRY_DSN=https://...
```

### WhatsApp Bot (whatsapp-bot/.env)

```bash
# Twilio
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Supabase (Service Key - server-side only)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Neo4j
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxxxx

PORT=3000
```

---

## Live Deployments

| Service | URL | Platform |
|---------|-----|----------|
| **Landing Page** | `https://apinlero.com` | Vercel |
| **Dashboard** | `https://app.apinlero.com` | Vercel |
| **Isha's Store** | `https://ishas-treat.apinlero.com` | Vercel |
| **WhatsApp Bot** | `https://web-production-63e51.up.railway.app` | Railway |
| **n8n Workflows** | `https://main-production-668a.up.railway.app` | Railway |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `project/src/App.tsx` | Main app with all routing logic |
| `project/src/contexts/BusinessContext.tsx` | Multi-tenant business context |
| `project/src/contexts/AuthContext.tsx` | Customer authentication |
| `project/src/lib/supabase.ts` | Supabase client setup |
| `project/src/lib/stripe.ts` | Stripe integration |
| `project/src/lib/email.ts` | Resend email service |
| `project/src/lib/storage.ts` | Supabase storage utilities |
| `project/src/lib/business-resolver.ts` | Subdomain business lookup |
| `project/src/pages/Dashboard.tsx` | Business owner dashboard |
| `project/src/pages/Shop.tsx` | Customer storefront |
| `project/src/pages/Checkout.tsx` | Checkout flow |
| `project/src/components/InventoryManager.tsx` | Product management |
| `project/api/notify.js` | Order notification API |
| `whatsapp-bot/src/server.js` | WhatsApp bot entry point |
| `whatsapp-bot/src/message-handler.js` | Message processing |

---

## Deployment

### Quick Deploy (Recommended)

```bash
/fix-deploy
```

### Manual Deployment

```bash
# 1. Build locally
cd Apinlero_MVP/project
npm run build

# 2. Commit and push
git add .
git commit -m "your message"
git push origin main

# 3. If auto-deploy fails
npx vercel --prod --yes --force
```

### WhatsApp Bot (Railway)

```bash
cd Apinlero_MVP/whatsapp-bot
git push railway main
```

---

## Testing

### Frontend Tests

```bash
cd Apinlero_MVP/project
npm run test        # Watch mode
npm run test:run    # Single run
npm run test:coverage
```

### WhatsApp Bot Tests

```bash
cd Apinlero_MVP/whatsapp-bot
npm test
```

---

## Claude Code Skills

Available skills for common tasks:

| Skill | Command | Description |
|-------|---------|-------------|
| **Fix Deploy** | `/fix-deploy` | Automated deployment with auto-fix |
| **Test Webhook** | `/test-webhook` | Test WhatsApp/n8n webhooks |
| **Test Bot** | `/test-bot` | Test WhatsApp bot responses |
| **Test Payment** | `/test-payment` | Test Stripe payment flows |
| **Deploy Vercel** | `/deploy-vercel` | Deploy frontend to Vercel |
| **Deploy Railway** | `/deploy-railway` | Deploy bot/backend to Railway |
| **Env Sync** | `/env-sync` | Sync environment variables |
| **DB Migrate** | `/db-migrate` | Run Supabase migrations |
| **DB Seed** | `/db-seed` | Seed test data |

---

## Pilot Customer

**Isha's Treat & Groceries**
- **Dashboard**: `https://app.apinlero.com`
- **Store**: `https://ishas-treat.apinlero.com`
- **Test Email**: `Info@ishastreatandgroceriescom.uk`

---

## GDPR Compliance

- [x] Supabase in EU region (Ireland)
- [x] Privacy Policy at `/privacy`
- [x] Cookie consent banner
- [x] Data deletion process documented
- [x] Private storage buckets for customer data

---

## Known Issues

1. **RLS Partially Disabled**: Some Row Level Security policies disabled for testing
2. **NPM Audit Vulnerabilities**: 26 in project/ (run `npm audit fix`)
3. **Neo4j Password**: Cannot rotate on Aura free tier

## ⚠️ Critical Deployment Rules

### DO NOT add www ↔ root domain redirects in vercel.json

Vercel's **domain settings** (configured in the Vercel dashboard) handle the `apinlero.com` → `www.apinlero.com` redirect automatically. Adding a competing redirect in `project/vercel.json` (e.g., `www.apinlero.com` → `apinlero.com`) will create an **infinite redirect loop** that breaks all JS/CSS asset loading, causing a blank white page.

**Rule**: The `"redirects"` array in `project/vercel.json` must stay empty (`[]`) unless the redirect does NOT involve `www` ↔ root domain swapping. If you need to change the canonical domain (www vs non-www), change it in the **Vercel dashboard** under Project → Settings → Domains, NOT in `vercel.json`.

---

## Security Status

### Active Protection ✅
- **Pre-commit hooks enabled** - Blocks secrets before commit
- **Gitleaks configured** - Industry-standard secret detection
- **Git hooks tested** - Verified working (see test results above)
- **.gitignore configured** - All `.env` files excluded

### Credential Security
- **Service keys server-side only** - Never exposed in frontend
- **Supabase anon key** is safe for frontend (RLS protects data)
- **Rotation guides available** - See [CREDENTIAL_ROTATION_GUIDE.md](CREDENTIAL_ROTATION_GUIDE.md)

### Quick Security Actions

**To rotate exposed credentials:**
```bash
# See detailed guide
open CREDENTIAL_ROTATION_GUIDE.md

# Or quick start
open SECURITY_QUICK_START.md
```

**Test pre-commit hook:**
```bash
cd Apinlero_MVP
echo "SECRET_KEY=test123" > test.txt
git add test.txt && git commit -m "test"
# Should be blocked by pre-commit hook
rm test.txt && git reset HEAD test.txt
```

---

## WhatsApp Bot Features

The WhatsApp bot supports natural language ordering:

**Commands**:
- "Hi" / "Hello" - Greeting and menu
- "2x palm oil to SE15 4AA" - Quick order
- "Show my orders" - Order history
- "Track order #ABC123" - Order status

**Features**:
- Natural language parsing with intent detection
- Product matching via Neo4j knowledge graph
- Multi-tenant (supports multiple businesses)
- Media handling (images, voice notes)
- Smart suggestions and humanized responses

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `CLAUDE.md` | This file - project overview |
| `CREDENTIAL_ROTATION_GUIDE.md` | **Step-by-step credential rotation** |
| `SECURITY_QUICK_START.md` | **Quick security reference** |
| `INFRASTRUCTURE_GUIDE.md` | Infrastructure setup |
| `SECURITY_GUIDE.md` | Security policies |
| `TROUBLESHOOTING.md` | Common issues |
| `docs/DATA_DELETION_PROCESS.md` | GDPR data deletion |
| `project/DATABASE-SETUP.md` | Database setup guide |
| `whatsapp-bot/ARCHITECTURE.md` | Bot architecture |

---

*Last Updated: February 4, 2026*
