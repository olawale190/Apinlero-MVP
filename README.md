# Apinlero MVP

A wholesale/retail management platform for small businesses, featuring inventory management, WhatsApp ordering, and multi-channel sales.

## Live Demo

| Service | URL |
|---------|-----|
| Landing Page | https://apinlero.com |
| Dashboard | https://app.apinlero.com |
| Store Example | https://ishas-treat.apinlero.com |

## Features

- **Inventory Management** - Track products, stock levels, expiry dates
- **WhatsApp Ordering** - Customers order via WhatsApp bot
- **Product Catalog** - Image uploads, categories, bulk pricing
- **Multi-Channel Orders** - Web, WhatsApp, Phone
- **Automated Alerts** - Low stock, expiry warnings via n8n
- **Media Storage** - Store WhatsApp images, receipts, documents

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React + TypeScript + Vite |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | Supabase Auth |
| Hosting | Vercel (Frontend), Railway (Backend) |
| Automation | n8n |
| WhatsApp | Twilio API + Meta Cloud API |
| Knowledge Graph | Neo4j Aura |

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Twilio account (for WhatsApp)

### Installation

```bash
# Clone repository
git clone https://github.com/olawale190/Apinlero-MVP.git
cd Apinlero-MVP

# Install frontend dependencies
cd project
npm install

# Start development server
npm run dev
```

### Environment Variables

Create `.env.local` in the `project/` directory:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For WhatsApp bot (`whatsapp-bot/.env`):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

## Project Structure

```
Apinlero_MVP/
├── project/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/         # React components
│   │   ├── lib/                # Utilities (supabase, storage, n8n)
│   │   └── pages/              # Page components
│   └── n8n-workflows/          # n8n workflow JSON files
├── whatsapp-bot/               # WhatsApp Bot (Node.js)
│   └── src/
│       ├── server.js           # Express webhook server
│       ├── message-handler.js  # Message processing
│       └── supabase-client.js  # Database operations
└── docs/                       # Documentation
```

## Documentation

| Document | Description |
|----------|-------------|
| [CLAUDE.md](CLAUDE.md) | Development notes, current state, AI assistant context |
| [SECURITY_GUIDE.md](SECURITY_GUIDE.md) | RLS policies, environment setup, security best practices |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | Common issues and solutions, debugging guide |
| [INFRASTRUCTURE_GUIDE.md](INFRASTRUCTURE_GUIDE.md) | Complete infrastructure documentation |

## Deployments

### Frontend (Vercel)

```bash
cd project
npm run build
npx vercel --prod
```

### WhatsApp Bot (Railway)

```bash
cd whatsapp-bot
railway up
```

## WhatsApp Bot

### Join the Bot (Sandbox)
1. Save number: +1 415 523 8886
2. Send: `join material-during`
3. Start ordering!

Or click: [Join WhatsApp Bot](https://wa.me/14155238886?text=join%20material-during)

### Example Commands
- "Hi" - Start conversation
- "I want 2 palm oil" - Order products
- "My order" - Check order status
- "Menu" - See options

## Database Schema

Key tables in Supabase:

| Table | Purpose |
|-------|---------|
| `products` | Product catalog |
| `orders` | Customer orders |
| `customers` | Customer information |
| `conversations` | WhatsApp chat sessions |
| `messages` | Message history |
| `media_files` | Uploaded files tracking |

## Storage Buckets

| Bucket | Visibility | Purpose |
|--------|------------|---------|
| `apinlero-products` | Public | Product images |
| `apinlero-media` | Private | WhatsApp media |
| `apinlero-documents` | Private | Receipts, invoices |

## Security Notes

> **Current Status**: RLS is disabled for testing. See [SECURITY_GUIDE.md](SECURITY_GUIDE.md) for production setup.

Before production:
1. Enable RLS on all tables
2. Configure storage policies
3. Use service key only on backend
4. Validate environment on startup

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Common Issues

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions. Quick fixes:

| Issue | Solution |
|-------|----------|
| "Bucket not found" | Upload directly, don't check bucket exists |
| "Permission denied" | Check RLS policies or use service key |
| Works locally, fails in prod | Sync Vercel env vars |

## License

Private - All rights reserved

## Contact

- GitHub: [@olawale190](https://github.com/olawale190)
- Project: [Apinlero-MVP](https://github.com/olawale190/Apinlero-MVP)

---

*Built for Isha's Treat & Groceries - South London, UK*
