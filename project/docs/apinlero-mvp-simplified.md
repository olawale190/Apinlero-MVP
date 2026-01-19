# Àpínlẹ̀rọ MVP Specification
## Innovator Founder Visa - Interview Ready

**Version:** 3.0 (Simplified)  
**Target:** 3-4 days of development  
**Goal:** Demonstrate working product to endorsement panel

---

## What The Panel Wants To See

| They Ask | You Show |
|----------|----------|
| "Is this real?" | Live site at apinlero.com |
| "Does it work?" | WhatsApp order flow with Isha's Treat |
| "Is it innovative?" | Knowledge Graph explanation on site |
| "Can it make money?" | Pricing page + pilot customer |
| "Can you execute?" | You built this yourself |

---

## MVP Scope (4 Days)

### Day 1: Landing Page + Domain
- [ ] Connect apinlero.com in Vercel
- [ ] Build professional landing page
- [ ] Add pricing section
- [ ] Add privacy/terms pages

### Day 2: WhatsApp Fix + Demo Flow
- [ ] Fix System User token (permanent)
- [ ] Test full order flow with Isha's Treat products
- [ ] Ensure bot responds correctly

### Day 3: Basic Admin View
- [ ] Simple dashboard showing today's orders
- [ ] Product list with edit price button
- [ ] That's it. Nothing fancy.

### Day 4: Polish + Test
- [ ] Test everything end-to-end
- [ ] Fix any bugs
- [ ] Mobile test the landing page
- [ ] Prepare demo script

---

## 1. Landing Page (Day 1)

### 1.1 Sections To Build

```
┌─────────────────────────────────────────┐
│ Nav: Logo | Features | Pricing | Login  │
├─────────────────────────────────────────┤
│ HERO                                    │
│ "One Platform. Any Channel."            │
│ [Start Free Trial]                      │
├─────────────────────────────────────────┤
│ PROBLEM (3 pain points)                 │
├─────────────────────────────────────────┤
│ SOLUTION (3 feature cards)              │
├─────────────────────────────────────────┤
│ HOW IT WORKS (4 steps)                  │
├─────────────────────────────────────────┤
│ PILOT CUSTOMER (Isha's Treat quote)     │
├─────────────────────────────────────────┤
│ PRICING (3 tiers)                       │
├─────────────────────────────────────────┤
│ FOOTER                                  │
└─────────────────────────────────────────┘
```

### 1.2 Key Content

**Hero:**
```
Headline: "One Platform. Any Channel. Any Business."
Subhead: "AI-powered operations for UK SMEs. Unify WhatsApp, 
         web, and phone into one intelligent system."
CTA: "Start Free Trial" → /signup (can be placeholder)
```

**Problem Section:**
```
"Sound familiar?"
• Orders lost in WhatsApp chaos
• Staff juggling 6 different apps  
• No warning before customers leave
```

**Solution Cards:**
```
Card 1: "Every Channel, One Inbox"
Card 2: "AI That Knows Your Customers"  
Card 3: "Automatic Order Processing"
```

**How It Works:**
```
1. Customer sends WhatsApp message
2. AI understands what they need
3. Order confirmed automatically
4. You see everything in one dashboard
```

**Pilot Customer:**
```
"We were losing orders every week from missed messages. 
Àpínlẹ̀rọ changed how we run the business."
— Isha's Treat & Groceries
```

**Pricing:**
```
Solo: £150/mo (1-4 staff)
Starter: £250/mo (5-15 staff)  
Growth: £350/mo (15-30 staff)
"30-day free trial"
```

### 1.3 Pages Needed

| Page | URL | Content |
|------|-----|---------|
| Landing | / | Main marketing page |
| Pricing | /pricing | Detailed pricing (or section on landing) |
| Privacy | /privacy | Privacy policy |
| Terms | /terms | Terms of service |
| Login | /login | Existing auth page |

### 1.4 Domain Setup

**In Vercel Dashboard:**
1. Project → Settings → Domains
2. Add `apinlero.com`
3. Add `www.apinlero.com` (redirect to apex)
4. Add `apinlero.co.uk` (redirect to apinlero.com)

**At Your Domain Registrar:**
```
apinlero.com:
  A     @     76.76.21.21
  CNAME www   cname.vercel-dns.com

apinlero.co.uk:
  A     @     76.76.21.21
  CNAME www   cname.vercel-dns.com
```

---

## 2. WhatsApp Fix (Day 2)

### 2.1 The Problem
Current token expires every 24 hours.

### 2.2 The Fix
Create permanent System User token in Meta Business Suite.

### 2.3 Steps

1. Go to business.facebook.com → Business Settings
2. Users → System Users → Add
3. Create "Apinlero Bot" with Admin role
4. Add Assets: WhatsApp Business Account + Phone Number
5. Generate Token with permissions:
   - `whatsapp_business_management`
   - `whatsapp_business_messaging`
6. Copy token to environment variable

### 2.4 Code Update

```javascript
// whatsapp-bot/src/whatsapp-api.js

// Validate token on startup
async function validateWhatsAppToken() {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}`,
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}` } }
    );
    
    if (!response.ok) {
      console.error('❌ WhatsApp token invalid');
      return false;
    }
    
    console.log('✅ WhatsApp token valid');
    return true;
  } catch (error) {
    console.error('❌ WhatsApp validation failed:', error);
    return false;
  }
}

// Call on server start
validateWhatsAppToken();
```

### 2.5 Test Checklist

- [ ] Send "Hi" to WhatsApp number → Get greeting response
- [ ] Send "What do you have?" → Get product list
- [ ] Send "I want 2 bags of rice" → Order created
- [ ] Check order appears in database

---

## 3. Basic Admin Dashboard (Day 3)

### 3.1 Scope (Keep It Simple!)

**DO build:**
- Orders list for today
- Edit product price
- View product list

**DON'T build:**
- Multi-tenant
- User roles
- Complex filters
- Bulk operations
- Image upload (use existing images)

### 3.2 Dashboard Page

```
┌─────────────────────────────────────────────────────────────┐
│  Àpínlẹ̀rọ Admin                              [Logout]      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Today's Summary                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                    │
│  │ Orders   │ │ Revenue  │ │ Pending  │                    │
│  │    5     │ │  £127    │ │    2     │                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
│  Recent Orders                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ #APL-001 │ John │ £45.00 │ Pending │ [View]        │   │
│  │ #APL-002 │ Mary │ £82.00 │ Confirmed │ [View]      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Products                              [+ Add Product]      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Palm Oil 5L    │ £25.00 │ In Stock │ [Edit]        │   │
│  │ Rice 50kg      │ £45.00 │ In Stock │ [Edit]        │   │
│  │ Egusi Seeds    │ £12.50 │ Low      │ [Edit]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Edit Product Modal

```
┌─────────────────────────────────────────┐
│  Edit Product                     [X]   │
├─────────────────────────────────────────┤
│                                         │
│  Name: [Palm Oil 5L          ]          │
│                                         │
│  Price: £[25.00              ]          │
│                                         │
│  Stock: [50                  ]          │
│                                         │
│  Status: [●] In Stock  [ ] Out of Stock │
│                                         │
│         [Cancel]  [Save Changes]        │
│                                         │
└─────────────────────────────────────────┘
```

### 3.4 Files To Create/Modify

```
src/
├── app/
│   ├── page.tsx              ← Landing page (new)
│   ├── pricing/
│   │   └── page.tsx          ← Pricing page (new)
│   ├── privacy/
│   │   └── page.tsx          ← Privacy policy (new)
│   ├── terms/
│   │   └── page.tsx          ← Terms of service (new)
│   ├── admin/
│   │   └── page.tsx          ← Simple dashboard (modify)
│   └── api/
│       └── products/
│           └── [id]/
│               └── route.ts  ← Update product endpoint (new)
├── components/
│   ├── landing/
│   │   ├── Hero.tsx          ← New
│   │   ├── Problem.tsx       ← New
│   │   ├── Solution.tsx      ← New
│   │   ├── HowItWorks.tsx    ← New
│   │   ├── Testimonial.tsx   ← New
│   │   ├── Pricing.tsx       ← New
│   │   └── Footer.tsx        ← New
│   └── admin/
│       ├── MetricsCards.tsx  ← New
│       ├── OrdersList.tsx    ← Simplify existing
│       ├── ProductsList.tsx  ← Simplify existing
│       └── EditProductModal.tsx ← New
```

---

## 4. Demo Script (Day 4)

### 4.1 What To Show The Panel

**Part 1: The Problem (30 seconds)**
"Let me show you what SME owners deal with today..."
- Show WhatsApp with multiple chats
- Show spreadsheet chaos
- "Orders get lost. Customers leave."

**Part 2: The Solution (2 minutes)**
"Here's how Àpínlẹ̀rọ fixes this..."
- Show landing page (apinlero.com)
- Explain the Knowledge Graph concept
- Show pricing

**Part 3: Live Demo (3 minutes)**
"Let me show you it working with our pilot customer..."
1. Open WhatsApp on your phone
2. Send: "Hi, I need 2 bags of rice and palm oil"
3. Show bot response
4. Show order appear in admin dashboard
5. Edit a product price
6. Show it updates

**Part 4: Traction (1 minute)**
"We already have validation..."
- Isha's Treat pilot
- Letters of Intent from 3 sectors
- Community access via Naija UK Connect

---

## 5. Ralph Loop Commands

### Command 1: Landing Page (Run First)

```bash
/ralph-loop "Build a professional landing page for Àpínlẹ̀rọ.

Create these components in src/components/landing/:
- Hero.tsx: Headline 'One Platform. Any Channel. Any Business.', subheadline about AI-powered operations for UK SMEs, CTA button
- Problem.tsx: 3 pain points with icons (orders lost, too many apps, no warning)
- Solution.tsx: 3 feature cards (Multi-channel inbox, AI context, Auto processing)
- HowItWorks.tsx: 4 steps with icons (message → AI understands → order confirmed → dashboard)
- Testimonial.tsx: Quote from Isha's Treat & Groceries
- Pricing.tsx: 3 tier cards (Solo £150, Starter £250, Growth £350)
- Footer.tsx: Links, copyright Lazrap Ltd 2026

Create src/app/page.tsx that imports and displays all sections.

Design:
- Primary color: #4F46E5 (Indigo)
- Clean, modern SaaS style
- TailwindCSS only
- Mobile responsive
- Inter font

Success criteria:
- Landing page renders at localhost:3000
- All 7 sections visible
- Mobile responsive (375px width)
- npm run build passes

Output <promise>DONE</promise> when complete." --max-iterations 25
```

### Command 2: Legal Pages

```bash
/ralph-loop "Create legal pages:

1. src/app/privacy/page.tsx - Privacy Policy
   - GDPR compliant
   - Data collection, usage, rights
   - Contact: hello@apinlero.com
   - Company: Lazrap Ltd

2. src/app/terms/page.tsx - Terms of Service
   - Service description
   - User responsibilities
   - Payment terms
   - Limitation of liability

Both pages should:
- Match landing page styling
- Have navigation back to home
- Include last updated date: January 2026

Output <promise>DONE</promise> when both pages render." --max-iterations 15
```

### Command 3: WhatsApp Token Fix

```bash
/ralph-loop "Fix WhatsApp token validation:

1. In whatsapp-bot/src/whatsapp-api.js:
   - Add validateWhatsAppToken() function
   - Call it on server startup
   - Log success/failure clearly

2. In whatsapp-bot/src/server.js:
   - Add /health endpoint that checks token validity
   - Return {status: 'healthy', whatsapp: true/false}

3. Update .env.example with:
   - WHATSAPP_ACCESS_TOKEN (note: use System User token)
   - WHATSAPP_PHONE_NUMBER_ID
   - WHATSAPP_VERIFY_TOKEN

Success criteria:
- Server logs '✅ WhatsApp token valid' on startup
- /health endpoint returns status
- npm run build passes

Output <promise>DONE</promise> when complete." --max-iterations 15
```

### Command 4: Simple Admin Dashboard

```bash
/ralph-loop "Simplify the admin dashboard:

1. Create src/app/admin/page.tsx with:
   - 3 metric cards (Orders today, Revenue today, Pending orders)
   - Recent orders table (order#, customer, amount, status)
   - Products table (name, price, stock, edit button)

2. Create src/components/admin/EditProductModal.tsx:
   - Fields: name (readonly), price (editable), stock (editable), status toggle
   - Save button calls PATCH /api/products/[id]
   - Cancel closes modal

3. Create src/app/api/products/[id]/route.ts:
   - PATCH handler to update price, stock, is_active
   - Validate inputs
   - Return updated product

Keep it simple:
- No complex filters
- No pagination (show last 10 orders)
- No image upload
- Single tenant (Isha's Treat only)

Success criteria:
- Dashboard shows real data from Supabase
- Can edit product price and save
- Changes persist in database
- npm run build passes

Output <promise>DONE</promise> when complete." --max-iterations 25
```

---

## 6. Checklist Before Interview

### Technical
- [ ] apinlero.com loads (HTTPS)
- [ ] apinlero.co.uk redirects to .com
- [ ] Landing page looks professional
- [ ] WhatsApp bot responds
- [ ] Can place order via WhatsApp
- [ ] Admin dashboard shows orders
- [ ] Can edit product price
- [ ] No console errors
- [ ] Mobile responsive

### Content
- [ ] No placeholder text
- [ ] Company name correct (Lazrap Ltd)
- [ ] Pricing matches business plan
- [ ] Isha's Treat mentioned as pilot
- [ ] Privacy policy exists
- [ ] Terms of service exists

### Demo Prep
- [ ] WhatsApp logged in on phone
- [ ] Admin dashboard open on laptop
- [ ] Test order flow works
- [ ] Know your demo script
- [ ] Backup: screenshots if live demo fails

---

## 7. What NOT To Build (Save For Later)

| Feature | Why Wait |
|---------|----------|
| Multi-tenant | You have 1 client. Build when you have 2. |
| Image upload | Existing product images work fine |
| User roles | You're the only admin right now |
| Voice processing | Nice to have, not required |
| Knowledge Graph | Explain concept, don't need full implementation |
| Bulk operations | Premature optimization |
| Activity logging | No compliance requirement yet |
| Churn prediction | Need 3+ months of data first |

---

## 8. Timeline

| Day | Tasks | Hours |
|-----|-------|-------|
| 1 | Domain setup + Landing page | 4-6 |
| 2 | WhatsApp fix + Test order flow | 2-3 |
| 3 | Simple admin dashboard | 4-5 |
| 4 | Polish + Test + Demo prep | 2-3 |

**Total: ~15 hours of focused work**

---

## 9. After Visa Approval

Once you have the Innovator Founder visa, THEN build:

**Month 1-2:**
- Multi-tenant architecture
- Product image management
- Full business portal

**Month 3-4:**
- Client #2 and #3 onboarding
- Knowledge Graph integration
- Voice note processing

**Month 5-6:**
- Staff management
- Advanced analytics
- Churn prediction

---

**Remember:** The visa panel isn't evaluating your code. They're evaluating YOU and your ability to build a scalable UK business. A clean, working demo beats an over-engineered half-finished product every time.

Good luck! 🚀
