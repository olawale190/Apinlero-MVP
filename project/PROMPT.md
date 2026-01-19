# Àpínlẹ̀rọ - MVP Development Instructions

**Goal:** Interview-ready product in 4 days  
**Target:** https://apinlero.com

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TailwindCSS |
| Backend | Express.js (WhatsApp bot) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel |
| Messaging | WhatsApp Business API |

## Project Structure
```
src/
├── app/
│   ├── page.tsx              ← Landing page
│   ├── admin/page.tsx        ← Simple dashboard
│   ├── privacy/page.tsx      ← Privacy policy
│   ├── terms/page.tsx        ← Terms of service
│   └── api/products/[id]/    ← Product update API
├── components/
│   ├── landing/              ← Landing page sections
│   └── admin/                ← Dashboard components
whatsapp-bot/
└── src/
    ├── server.js             ← Webhook server
    ├── whatsapp-api.js       ← Meta API client
    └── message-handler.js    ← Message processing
```

## Brand
- **Primary Color:** #4F46E5 (Indigo)
- **Font:** Inter
- **Company:** Lazrap Ltd
- **Product:** Àpínlẹ̀rọ

## Database Tables
- `products` - 15 African & Caribbean products
- `customers` - Customer info
- `orders` - Order records

---

## MVP Tasks (4 Days)

### Day 1: Landing Page
Build professional landing page with these sections:
1. Hero - "One Platform. Any Channel. Any Business."
2. Problem - 3 pain points SME owners face
3. Solution - 3 feature cards
4. How It Works - 4 step visual
5. Testimonial - Isha's Treat quote
6. Pricing - Solo £150 / Starter £250 / Growth £350
7. Footer - Links, Lazrap Ltd copyright

### Day 2: WhatsApp Fix
1. Add token validation on startup
2. Add /health endpoint
3. Test full order flow

### Day 3: Simple Admin
1. Metrics cards (orders, revenue, pending)
2. Recent orders list
3. Products list with edit price button
4. Edit modal (price, stock, status)

### Day 4: Polish
1. Test everything
2. Fix bugs
3. Mobile test
4. Prepare demo

---

## Verification Commands
```bash
npm run build        # Must pass
npm run lint         # Must pass
npm run dev          # Test locally
```

## Success Criteria
- [ ] apinlero.com loads with SSL
- [ ] Landing page renders all sections
- [ ] Mobile responsive
- [ ] WhatsApp bot responds to messages
- [ ] Can place order via WhatsApp
- [ ] Admin shows orders
- [ ] Can edit product price
- [ ] No console errors

---

## What NOT To Build
- Multi-tenant (wait for client #2)
- Image upload
- User roles
- Voice processing
- Complex filters
- Bulk operations

---

## Output Format
When task complete:
```
<promise>DONE</promise>
```

If blocked:
```
<promise>BLOCKED</promise>
Reason: [explanation]
```
