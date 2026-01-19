# Apinlero MVP - Development Notes

This document tracks the development progress and architecture decisions for the Apinlero MVP project.

---

## Project Overview

**Apinlero** is a wholesale/retail management platform for small businesses, featuring:
- Inventory management with barcode/QR scanning
- WhatsApp integration for customer orders
- Multi-channel order processing (Web, WhatsApp, Phone)
- Product catalog with image uploads
- Automated alerts and reporting via n8n

**Primary Use Case**: Isha's Treat - African grocery wholesale/retail business in the UK

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript + Vite |
| **Styling** | Tailwind CSS |
| **Database** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage |
| **Auth** | Supabase Auth |
| **Hosting** | Vercel (Frontend), Railway (Backend/Bot) |
| **Automation** | n8n (workflows, emails, backups) |
| **WhatsApp** | Twilio WhatsApp API |
| **Knowledge Graph** | Neo4j Aura (product aliases) |

---

## Infrastructure Setup (Completed)

### Supabase Configuration
- **Region**: Ireland (eu-west-1) - GDPR compliant for UK business
- **Storage Buckets Created**:
  - `apinlero-media` (private) - WhatsApp images, voice notes
  - `apinlero-documents` (private) - Receipts, invoices, reports
  - `apinlero-products` (public) - Product catalog images

### Database Tables
Core tables exist in Supabase. Additional tables created for storage tracking:
- `media_files` - Tracks all uploaded files with metadata
- `storage_usage` - Daily storage statistics
- `daily_reports` - Business reports archive
- `backup_logs` - Backup operation history

SQL migration file: `project/supabase_storage_migration.sql`

---

## Features Implemented

### 1. Inventory Manager (`project/src/components/InventoryManager.tsx`)

**Core Features**:
- Product CRUD operations
- Stock quantity management (+/- controls)
- Low stock alerts (threshold: 5 units)
- Expiry date tracking with alerts
- Category management
- Barcode/QR code scanning
- QR code generation for products
- Bulk pricing tiers

**Product Image Upload** (Recently Added):
- Image upload in Add Product form
- Image upload in Edit Product form
- Image preview before saving
- Loading indicator during upload
- Remove image functionality
- File validation (max 5MB, images only)
- Images display in inventory grid
- "OUT OF STOCK" badge overlay on product images

### 2. Storage System (`project/src/lib/storage.ts`)

**Functions Available**:
```typescript
// Basic Storage Operations
uploadFile(bucket, file, folder?)
uploadBase64File(bucket, base64Data, fileName, contentType, folder?)
getPublicUrl(bucket, path)
getSignedUrl(bucket, path, expiresIn?)
downloadFile(bucket, path)
listFiles(bucket, folder?, limit?)
deleteFile(bucket, path)
testStorageConnection()

// Database Tracking
logFileToDatabase(record)
uploadAndTrack(bucket, file, options)  // Upload + track in one call
getCustomerFiles(customerPhone)
getOrderFiles(orderId)

// Statistics
getStorageStats()
checkStorageLimits()
```

**Bucket Constants**:
```typescript
BUCKETS = {
  MEDIA: 'apinlero-media',
  DOCUMENTS: 'apinlero-documents',
  PRODUCTS: 'apinlero-products'
}
```

### 3. n8n Integration (`project/src/lib/n8n-storage.ts`)

**Webhook Endpoints**:
- `POST /storage/upload` - Universal file upload
- `POST /storage/whatsapp-media` - Store WhatsApp media
- `POST /storage/generate-receipt` - Create PDF receipts
- `POST /storage/backup` - Trigger manual backup
- `GET /storage/stats` - Get storage statistics
- `POST /manual-order-email` - Send order confirmation
- `POST /manual-stock-alert` - Low stock notification
- `POST /manual-expiry-alert` - Expiry warning
- `POST /manual-daily-summary` - Daily business report

### 4. n8n Workflows (`project/n8n-workflows/`)

**Unified Storage Orchestrator** (`unified-storage-orchestrator.json`):
- Central workflow for all storage operations
- Routes files to appropriate buckets
- Handles WhatsApp media from Twilio
- Logs all uploads to database

**Daily Operations** (`daily-operations-workflow.json`):
- Scheduled triggers: 6 AM (reports), 10 PM (backups)
- Fetches daily orders and calculates stats
- Checks low stock products
- Checks expiring products (7-day warning)
- Creates daily reports
- Performs nightly backups

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `project/src/components/InventoryManager.tsx` | Main inventory UI component |
| `project/src/lib/storage.ts` | Supabase storage utilities |
| `project/src/lib/n8n-storage.ts` | n8n webhook triggers |
| `project/src/lib/n8n.ts` | n8n alert functions |
| `project/src/lib/supabase.ts` | Supabase client setup |
| `project/supabase_storage_migration.sql` | Database migration for storage tracking |
| `project/n8n-workflows/*.json` | n8n workflow definitions |
| `INFRASTRUCTURE_GUIDE.md` | Complete infrastructure documentation |

---

## Environment Variables Required

```bash
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# n8n (optional - for automation features)
VITE_N8N_WEBHOOK_URL=https://your-instance.app.n8n.cloud/webhook

# Twilio (for WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxx
TWILIO_AUTH_TOKEN=xxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Neo4j (for product knowledge graph)
NEO4J_URI=neo4j+s://xxxxx.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=xxxxx
```

---

## Cost Estimates (Monthly)

| Phase | Customers | Estimated Cost |
|-------|-----------|----------------|
| Launch | 0-50 | ~£25 |
| Growth | 50-200 | ~£55 |
| Scaling | 200-500 | ~£145 |
| Scale | 500-1000 | ~£245 |
| Enterprise | 1000+ | ~£470+ |

See `INFRASTRUCTURE_GUIDE.md` for detailed breakdown.

---

## UK GDPR Compliance

- [x] Supabase in EU region (Ireland)
- [x] Private buckets for customer data
- [x] Signed URLs with expiry for private files
- [x] Service keys kept server-side only
- [ ] Privacy Policy (to be created)
- [ ] Customer consent mechanism (to be implemented)
- [ ] Data deletion process (to be documented)

---

## Next Steps / TODO

### Immediate
- [ ] Set up n8n cloud instance and import workflows
- [ ] Test WhatsApp media storage flow end-to-end
- [ ] Configure daily backup workflow schedule
- [ ] Create privacy policy document

### Short Term
- [ ] Add product image display in customer-facing store
- [ ] Implement image compression before upload
- [ ] Add image gallery for products (multiple images)
- [ ] Set up uptime monitoring

### Medium Term
- [ ] WhatsApp bot integration with product images
- [ ] Customer order history with receipts
- [ ] Advanced reporting dashboard
- [ ] Mobile-optimized inventory management

---

## Development Commands

```bash
# Start development server
cd project
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Recent Changes Log

### January 19, 2026 - Production Deployment Session
- **WhatsApp Bot Deployed to Railway**: `https://web-production-63e51.up.railway.app`
- **Twilio Webhook Updated**: Points to Railway deployment
- **Landing Page Theme**: Changed from teal to Navy Blue across all platform components
- **Frontend Deployed to Vercel**: `https://project-apinlero.vercel.app`

### January 2026 (Earlier)
- **Storage System**: Implemented Supabase Storage integration with tracking
- **n8n Workflows**: Created daily operations and storage orchestrator workflows
- **Product Images**: Added image upload to Add/Edit Product forms
- **Inventory Grid**: Products now display images with out-of-stock overlay
- **Infrastructure Guide**: Created comprehensive documentation

---

## Live Deployments

| Service | URL | Platform |
|---------|-----|----------|
| **Web App / Dashboard** | `https://project-apinlero.vercel.app` | Vercel |
| **WhatsApp Bot** | `https://web-production-63e51.up.railway.app` | Railway |
| **Landing Page** | `https://project-apinlero.vercel.app` | Vercel |
| **Isha's Store** | `https://project-apinlero.vercel.app/store/ishas-treat` | Vercel |

---

## WhatsApp Bot Configuration

### Current Setup (Twilio Sandbox)
- **Sandbox Number**: +1 415 523 8886
- **Join Code**: `join loss-yellow`
- **Webhook URL**: `https://web-production-63e51.up.railway.app/webhook`
- **Status**: Live and working

### How Customers Join WhatsApp Bot
1. **Direct Link**: `https://wa.me/14155238886?text=join%20loss-yellow`
2. **Manual**: Save +1 415 523 8886, send "join loss-yellow"
3. Sessions expire after 72 hours of inactivity

### Moving to Production WhatsApp
To remove the "join" requirement:
1. Buy UK Twilio number (~$1/month)
2. Register for WhatsApp Business API in Twilio Console
3. Complete Meta Business Verification (1-2 weeks)
4. Update `TWILIO_WHATSAPP_NUMBER` in Railway env vars

---

## Railway Environment Variables

> **Note**: Secrets are stored in Railway Dashboard, not in this file.
> See Railway Dashboard → Variables for actual values.

```bash
TWILIO_ACCOUNT_SID=<your-twilio-sid>
TWILIO_AUTH_TOKEN=<your-twilio-token>
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_KEY=<your-supabase-key>
NEO4J_URI=<your-neo4j-uri>
NEO4J_USER=neo4j
NEO4J_PASSWORD=<your-neo4j-password>
PORT=3000
```

---

## Customer-Facing Links (For Isha to Share)

### Option 1: Online Store (Recommended)
```
https://project-apinlero.vercel.app/store/ishas-treat
```
- No setup required
- Browse products visually
- Checkout with bank transfer

### Option 2: WhatsApp Bot
```
https://wa.me/14155238886?text=join%20loss-yellow
```
- Customer clicks link
- Sends "join loss-yellow" to join sandbox
- Then can order via chat (e.g., "2x palm oil to SE15 4AA")

---

## Landing Page Color Scheme

**Theme**: Navy Blue (updated Jan 19, 2026)

Files updated:
- `project/src/components/platform/PlatformHero.tsx` - `from-blue-900 via-blue-800 to-indigo-900`
- `project/src/components/platform/PlatformFeatures.tsx` - `bg-blue-100`, `text-blue-600`
- `project/src/components/platform/PlatformTestimonial.tsx` - `from-blue-50 to-indigo-50`, `bg-blue-600`
- `project/src/components/platform/PlatformPricing.tsx` - `ring-blue-600`, `bg-blue-600`
- `project/src/components/platform/PlatformFooter.tsx` - `hover:text-blue-400`

---

## Pilot Customer: Isha's Treat & Groceries

- **Location**: South London, UK
- **Test Phone**: +44 7935 238972
- **Dashboard Login**: Demo login available at `/app`
- **Store URL**: `/store/ishas-treat`

---

*Last Updated: January 19, 2026*
