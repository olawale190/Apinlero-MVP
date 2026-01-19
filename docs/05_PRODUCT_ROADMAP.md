# Product Roadmap
## Àpínlẹ̀rọ - 18-Month Strategic Product Evolution

**Version:** 2.0 (Aligned with Business Plan v6.3)
**Date:** December 2024
**Planning Horizon:** December 2024 - June 2026
**Document Owner:** Product Strategy Team

---

## Executive Summary

This product roadmap outlines Àpínlẹ̀rọ's strategic evolution from single-customer MVP (TRL 6) to a horizontal AI-powered operations platform for UK SMEs across **10 high-value sectors**. The roadmap is structured in phases, balancing customer value delivery, technical innovation (Neo4j Knowledge Graph, Voice AI, n8n automation), and market expansion.

**Platform Vision:** *"One Platform. Any Channel. Any Business."*

**Current Position:**
- **Phase:** MVP (Phase 1) - COMPLETE
- **Target Market:** 10 high-value sectors (Field Services, Client/Appointment, Operations/Logistics, E-commerce/Retail)
- **Technology Readiness Level:** TRL 6 (Operational Environment)
- **Customers:** 1 pilot customer (Isha's Treat & Groceries)
- **Status:** Production, processing 15+ orders daily

**Strategic Direction:**
- **Year 1 (2025):** Scale to 45 customers, deploy Neo4j Knowledge Graph, launch WhatsApp API
- **Year 2 (2026):** Reach 150 customers, launch Voice AI (Vapi), advanced ML models
- **Year 3 (2027):** Scale to 400 customers, enterprise features, API platform
- **Vision (Beyond):** Universal platform for UK SMEs (5-50 employees), £780K+ ARR

**Technology Differentiation:**
- **Neo4j Knowledge Graph:** 47 entity types, 89 relationship types (Year 1)
- **Voice AI (Vapi):** 24/7 voice ordering and appointment booking (Year 2)
- **n8n Automation:** Workflow orchestration and integrations (Year 1-2)
- **Custom ML Models:** Demand Predictor, Anomaly Detector, Classification Engine (Year 2)

---

## Roadmap Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ÀPÍNLẸ̀RỌ PRODUCT ROADMAP                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: MVP Foundation         ✅ COMPLETE (Nov-Dec 2024)             │
│  └─ Multi-channel consolidation, AI insights, basic features            │
│                                                                          │
│  Phase 2: Year 1 (2025)          🚧 Q1-Q4 2025                          │
│  └─ 45 customers, Neo4j Knowledge Graph, WhatsApp API, n8n automation   │
│                                                                          │
│  Phase 3: Year 2 (2026)          📋 Q1-Q4 2026                          │
│  └─ 150 customers, Voice AI (Vapi), Custom ML Models, Mobile Apps       │
│                                                                          │
│  Phase 4: Year 3 (2027)          📋 2027                                │
│  └─ 400 customers, Enterprise features, API platform, £780K ARR         │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: MVP Foundation (✅ COMPLETE)

**Timeline:** November - December 2024
**Status:** COMPLETE
**Goal:** Validate product-market fit with pilot customer, achieve TRL 6

### Delivered Features

#### Core Capabilities
- ✅ **Multi-Channel Order Capture**
  - WhatsApp, Web, Phone, Walk-in orders
  - Single unified dashboard
  - Real-time synchronization (<5 seconds)

- ✅ **AI Daily Insights**
  - Order volume trends
  - Top product identification
  - Peak channel analysis
  - Urgent action recommendations

- ✅ **Order Management**
  - 3-stage status workflow (Pending → Confirmed → Delivered)
  - Expandable order details
  - Customer information tracking
  - Notes and special instructions

- ✅ **Product Catalog**
  - 15 pre-seeded products (pilot customer: grocery)
  - Product images (Unsplash CDN)
  - Stock quantity display
  - Category organization

- ✅ **Payment Tracking (Basic)**
  - Payment status (Pending, Paid, Refunded, Failed)
  - Payment methods (Cash, Card, Bank Transfer, Online)
  - Stripe integration library (foundation)

#### Technical Foundation
- ✅ React 18 + TypeScript 5 + Vite
- ✅ Supabase (PostgreSQL + Real-time)
- ✅ Vercel hosting with global CDN
- ✅ Input validation and security (Zod)
- ✅ Mobile-responsive design
- ✅ 99.8% uptime achieved

### Business Results
- ✅ 1 pilot customer acquired (Isha's Treat)
- ✅ 15+ orders/day processed
- ✅ £700+ daily revenue managed
- ✅ 60% time savings for business owner
- ✅ Zero critical bugs or security incidents
- ✅ TRL 6 demonstrated for UKES application

---

## Phase 2: Year 1 - Foundation & Growth (2025)

**Timeline:** Q1-Q4 2025 (January - December 2025)
**Status:** 🚧 PLANNED
**Goal:** Scale to 45 customers, deploy Neo4j Knowledge Graph, achieve £84,400 ARR

### Business Targets (Year 1)

| Metric | Target |
|--------|--------|
| **Total Customers** | 45 |
| **MRR** | £13,250 |
| **ARR** | £84,400 |
| **ARPU** | £294/month |
| **CAC** | £150 |
| **LTV:CAC Ratio** | 23:1 |
| **Net Margin** | 62% |

**10 High-Value Sectors:**
- Field Services: HVAC, Plumbing, Electricians
- Client/Appointment: Dental, Healthcare, Real Estate
- Operations/Logistics: Security, Cleaning, Delivery
- E-commerce/Retail: Specialty Grocery, Personal Services

---

### Q1 2025: January - March (Customer Acquisition & Knowledge Graph)

#### Theme: Infrastructure & Data Intelligence

**Major Features:**

##### 1. Neo4j Knowledge Graph Deployment (CRITICAL PRIORITY) ⭐

**Problem:** AI insights are basic statistical calculations - need proprietary intelligence
**Solution:** Deploy Neo4j Knowledge Graph to capture SME operational patterns

**Architecture:**
- **Database:** Neo4j Cloud (EU region)
- **Entity Types:** 47 (SME, Customer, Order, Product/Service, Category, Sector, SectorTemplate, SeasonalPattern, BehaviorPattern, etc.)
- **Relationship Types:** 89 (HAS_CUSTOMER, PLACED, OPERATES_IN, EXHIBITS_PATTERN, SIMILAR_TO, etc.)

**Graph Schema:**
```cypher
(SME) -[:HAS_CUSTOMER]-> (Customer)
(Customer) -[:PLACED]-> (Order)
(Order) -[:CONTAINS]-> (Product/Service)
(Product/Service) -[:BELONGS_TO]-> (Category)
(SME) -[:OPERATES_IN]-> (Sector)
(Sector) -[:HAS_TEMPLATE]-> (SectorTemplate)
(Order) -[:EXHIBITS_PATTERN]-> (SeasonalPattern)
(SME) -[:SIMILAR_TO]-> (SME)
```

**Use Cases:**
- **"SMEs like you" Recommendations:** "Security companies in your revenue bracket typically see 20% more phone orders on Fridays"
- **Sector-Specific Insights:** "HVAC businesses see emergency callouts spike during cold snaps"
- **Demand Forecasting:** Predict order volumes 1-4 weeks ahead based on graph patterns

**Success Metrics:**
- Graph populated with 10+ customers' data by end of Q1
- "SMEs like you" recommendations achieve 75%+ accuracy
- 60%+ of customers find graph-powered insights valuable

**Technical Requirements:**
- Neo4j Cloud subscription (£200-300/month)
- Graph data ingestion pipeline from PostgreSQL
- Cypher query optimization
- Background jobs for pattern detection

**Timeline:** 6-8 weeks
**Priority:** P0 (Critical - Core Differentiation)

---

##### 2. WhatsApp Business API Integration (HIGH PRIORITY) ⭐

**Problem:** Manual WhatsApp order entry takes 1-2 minutes per order
**Solution:** Automated order capture from WhatsApp messages using AI

**Features:**
- Connect WhatsApp Business Account (Meta approval process: 3-4 weeks)
- Auto-capture incoming orders via AI parsing (Claude or GPT-4)
- Natural language processing for order extraction
- Two-way messaging (order confirmations, status updates)
- Support for text and voice messages
- Multi-conversation management

**AI Parsing Example:**
```
Customer: "Hi, I need 3x Rice 5kg and 2x Palm Oil. Deliver to 45 Brixton Hill SW2 1AA"
→ AI extracts:
  - Products: Rice 5kg (qty: 3), Palm Oil (qty: 2)
  - Delivery Address: 45 Brixton Hill, London SW2 1AA
  - Channel: WhatsApp
```

**Success Metrics:**
- 90%+ order parsing accuracy
- <30 second response time for confirmations
- 50%+ of customers adopt WhatsApp automation
- Save 5-10 hours/week per customer

**Technical Requirements:**
- WhatsApp Business API application (Meta)
- AI API integration (Claude/GPT-4)
- Message queue system (Redis)
- Webhook infrastructure

**Timeline:** 6-8 weeks (includes Meta approval)
**Priority:** P0 (Critical - Most Requested Feature)

---

##### 3. Customer Acquisition Engine (HIGH PRIORITY)

**Problem:** Need systematic approach to acquire 45 customers
**Solution:** Community-based acquisition strategy

**Acquisition Channels:**
- **Community Partnerships:** 70+ African/Caribbean community groups
- **Direct Outreach:** LinkedIn, trade associations, local business directories
- **Referral Program:** 1 month free for each successful referral
- **Word-of-Mouth:** Customer testimonials, case studies

**CAC Target:** £150 per customer (vs industry £300-500)

**Success Metrics:**
- 15 customers by end of Q1 (5 customers/month)
- 80%+ customer activation (first order within 7 days)
- 30%+ acquisition via referrals

**Timeline:** Ongoing throughout Q1
**Priority:** P0 (Critical - Business Growth)

---

**Q1 2025 Business Goals:**
- Onboard 15 customers (London focus)
- Achieve £4,000-5,000 MRR
- 90%+ customer retention
- Deploy Neo4j Knowledge Graph
- Launch WhatsApp automation for 8+ customers

---

### Q2 2025: April - June (Automation & Scalability)

#### Theme: Workflow Automation & Expansion

**Major Features:**

##### 4. n8n Workflow Automation Platform (HIGH PRIORITY) ⭐

**Problem:** Customers need integrations with accounting, delivery, and communication tools
**Solution:** Deploy n8n for visual workflow automation

**Technology:** n8n (open-source workflow automation)

**Integration Workflows:**
- **Accounting:** Auto-sync orders to Xero, QuickBooks, FreeAgent
- **Email/SMS:** Trigger notifications on order events (SendGrid, Twilio)
- **Delivery Services:** Connect to Uber Direct, Stuart, local couriers
- **Calendar:** Sync appointments to Google Calendar, Outlook (for service businesses)
- **Webhooks:** Custom integrations for sector-specific tools

**Sample Workflow:**
```
Order Status = "Confirmed"
  → Send SMS to customer (Twilio)
  → Create invoice in QuickBooks
  → Add delivery task to driver app
  → Update Neo4j graph with pattern data
```

**Success Metrics:**
- 40%+ of customers use at least 1 integration
- Average 2 integrations per customer
- 20% reduction in manual data entry

**Technical Requirements:**
- n8n self-hosted instance (cost: £50-100/month)
- Integration API credentials (Xero, Twilio, etc.)
- Workflow template library

**Timeline:** 5-6 weeks
**Priority:** P1 (High - Customer Value)

---

##### 5. Search, Filter, and Pagination (HIGH PRIORITY)

**Problem:** Cannot find orders quickly when there are 100+ orders
**Solution:** Advanced search and filtering capabilities

**Features:**
- Search by customer name, phone number, order ID
- Filter by date range, channel, status, payment status
- Pagination (25/50/100 orders per page)
- Sort by date, total, customer name
- Save filter presets (e.g., "Today's Pending Orders")

**Success Metrics:**
- Find specific order in <10 seconds
- Support 1,000+ orders without performance degradation

**Timeline:** 2-3 weeks
**Priority:** P1 (High)

---

##### 6. Enhanced AI Insights with Knowledge Graph (MEDIUM PRIORITY)

**Problem:** AI insights are basic, need to leverage Neo4j Knowledge Graph
**Solution:** Graph-powered recommendations and pattern recognition

**New Insights:**
- **Sector Benchmarking:** "Your order volume is 15% above the average for HVAC businesses in your region"
- **Demand Patterns:** "Cleaning services typically see 30% spike on Fridays - stock up on supplies"
- **Customer Retention:** "Customer retention rate: 85% (industry average: 70%)"
- **Cross-Sell Opportunities:** "Businesses like you also offer [related service]"

**Success Metrics:**
- AI prediction accuracy 80%+
- 60%+ of customers act on Knowledge Graph recommendations

**Timeline:** 3-4 weeks (requires Neo4j deployment)
**Priority:** P2 (Medium - Differentiation)

---

**Q2 2025 Business Goals:**
- Reach 30 total customers
- Achieve £8,000-9,000 MRR
- Launch n8n automation for 15+ customers
- Expand to 2 additional cities (Birmingham, Manchester)
- 95%+ customer retention

---

### Q3 2025: July - September (Product Polish & Sector Expansion)

#### Theme: Multi-Sector Validation

**Major Features:**

##### 7. Sector-Specific Templates (MEDIUM-HIGH PRIORITY)

**Problem:** Need to customize platform for different sectors
**Solution:** Pre-built templates for 10 high-value sectors

**Sector Templates:**

**Field Services (HVAC, Plumbing, Electricians):**
- Job booking workflow
- Emergency callout priority
- Service history tracking
- Equipment/parts inventory

**Client/Appointment Services (Dental, Healthcare, Real Estate):**
- Appointment scheduling
- Recurring appointments
- Patient/client profiles
- Service packages

**Operations/Logistics (Security, Cleaning, Delivery):**
- Shift scheduling
- Route optimization
- Recurring service contracts
- Site/location management

**E-commerce/Retail (Grocery, Personal Services):**
- Product catalog
- Inventory management
- Delivery tracking
- Customer loyalty programs

**Success Metrics:**
- 80%+ customers use sector-specific features
- 25% faster onboarding with templates
- 90% customer satisfaction with sector customization

**Timeline:** 4-5 weeks
**Priority:** P1 (High - Market Expansion)

---

##### 8. Inventory Management (MEDIUM PRIORITY)

**Problem:** Product-based businesses need stock tracking
**Solution:** Basic inventory management with AI-powered reorder suggestions

**Features:**
- Real-time stock tracking
- Auto-deduction on order confirmation
- Low stock alerts (email + in-app notifications)
- Reorder recommendations based on Knowledge Graph patterns
- Stock adjustment log (waste, theft, corrections)
- Stock valuation reports

**Success Metrics:**
- 60%+ of product-based customers adopt inventory management
- Reduce stock-outs by 50%
- Improve inventory turnover by 20%

**Technical Requirements:**
- New `inventory_transactions` table
- Background jobs for stock calculations
- Email notification service (SendGrid)

**Timeline:** 4-5 weeks
**Priority:** P2 (Medium)

---

**Q3 2025 Business Goals:**
- Reach 40 total customers
- Achieve £11,000-12,000 MRR
- Validate platform across all 4 sector groups
- Letters of Intent: Security, Healthcare, Cleaning (3+ signed)
- 95%+ customer retention

---

### Q4 2025: October - December (Year 1 Completion)

#### Theme: Consolidation & Preparation for Year 2

**Major Features:**

##### 9. Supabase Authentication & Multi-User Support (HIGH PRIORITY)

**Problem:** Businesses need team collaboration features
**Solution:** Implement Supabase Auth with role-based access control

**Features:**
- User roles: Owner, Manager, Staff
- Permission-based access control
- Activity logs (who did what, when)
- Team member invitations
- Role-specific dashboards

**Success Metrics:**
- 40%+ of customers add team members
- Average 2-3 users per business
- Zero unauthorized access incidents

**Timeline:** 4-5 weeks
**Priority:** P1 (High)

---

##### 10. Advanced Analytics Dashboard (MEDIUM PRIORITY)

**Problem:** Customers need deeper business insights
**Solution:** Analytics dashboard with charts and reports

**Features:**
- Sales trends over time (daily, weekly, monthly)
- Revenue and profit analysis
- Customer retention and churn analysis
- Product performance matrix
- Channel ROI analysis
- Export reports to PDF/Excel

**Success Metrics:**
- 60%+ of customers use analytics weekly
- Average 3+ reports exported per customer/month

**Technical Requirements:**
- Charting library (Recharts)
- PDF generation (jsPDF)
- Excel export (SheetJS)

**Timeline:** 3-4 weeks
**Priority:** P2 (Medium)

---

**Q4 2025 Business Goals:**
- **Reach 45 total customers (Year 1 Target Achieved)** ✅
- **Achieve £13,250 MRR, £84,400 ARR** ✅
- **LTV:CAC Ratio: 23:1** ✅
- Prepare for Year 2 Voice AI launch
- 95%+ customer retention
- 62% net profit margin

---

## Phase 3: Year 2 - Voice AI & Scale (2026)

**Timeline:** Q1-Q4 2026 (January - December 2026)
**Status:** 📋 PLANNED
**Goal:** Scale to 150 customers, launch Voice AI (Vapi), achieve £300,000 ARR

### Business Targets (Year 2)

| Metric | Target |
|--------|--------|
| **Total Customers** | 150 |
| **MRR** | £36,500 |
| **ARR** | £300,000 |
| **ARPU** | £294/month |
| **CAC** | £150 |
| **LTV:CAC Ratio** | 23:1 |
| **Net Margin** | 50% |

**Pricing Tiers (Year 2):**
- Free Trial: £0 (30 days)
- **Solo: £150/month** (launched Q1 2026)
- Starter: £250/month (includes 100 voice minutes)
- Growth: £350/month (includes 300 voice minutes)

---

### Q1 2026: January - March (Voice AI Launch)

#### Theme: Voice Intelligence

**Major Features:**

##### 11. Voice AI (Vapi) Integration (CRITICAL PRIORITY) ⭐⭐⭐

**Problem:** Businesses receive 40-60% of orders via phone - need 24/7 voice ordering
**Solution:** Launch Voice AI powered by Vapi for automated voice order capture

**Technology:** Vapi (best-in-class voice AI API)

**Voice AI Capabilities:**
- **24/7 Voice Ordering:** Customers call and place orders via voice
- **Appointment Booking:** Service businesses can accept bookings by phone
- **Natural Language Understanding:** AI understands context, accents, background noise
- **Multi-Language Support:** English, Yoruba, Twi, Polish, etc. (Phase 2.1)
- **Call Transcription:** All calls transcribed and logged
- **Order Confirmation:** AI reads back order for verification

**Voice AI Workflow:**
```
Customer calls business phone number
  → Vapi AI answers: "Thank you for calling [Business Name]. How can I help you today?"
  → Customer: "I'd like to order 3 rice bags and 2 palm oil"
  → AI: "Great! I have 3x Rice 5kg and 2x Palm Oil. Can I confirm your delivery address?"
  → Customer provides address
  → AI: "Perfect! Your order total is £45.50. We'll deliver within 2 hours. Thank you!"
  → Order automatically created in Àpínlẹ̀rọ platform
```

**Pricing Tiers:**
| Tier | Monthly Price | Voice Minutes Included | Overage Rate |
|------|--------------|----------------------|--------------|
| Solo | £150 | 50 minutes | £0.18/min |
| Starter | £250 | 100 minutes | £0.15/min |
| Growth | £350 | 300 minutes | £0.12/min |

**Success Metrics:**
- 50%+ of customers trial Voice AI
- 75%+ voice order accuracy
- 30%+ of customers adopt Voice AI (pay for overage or upgrade tier)
- Customer satisfaction: 4.5+ stars

**Technical Requirements:**
- Vapi API integration
- Phone number provisioning (Twilio)
- Voice order parsing and validation
- Call recording storage and playback

**Timeline:** 8-10 weeks
**Priority:** P0 (Critical - Major Differentiation)

---

##### 12. Solo Tier Launch (£150/month) (HIGH PRIORITY)

**Problem:** Need pricing tier for solopreneurs (1-2 employees)
**Solution:** Launch Solo tier at £150/month with 50 voice minutes

**Features:**
- All core features (multi-channel, AI insights, Knowledge Graph)
- 50 voice minutes/month
- Single user
- Community support

**Success Metrics:**
- 30%+ of new customers choose Solo tier
- 20+ Solo customers by end of Q1 2026

**Timeline:** 2 weeks
**Priority:** P1 (High - Revenue Growth)

---

**Q1 2026 Business Goals:**
- Reach 75 total customers
- Launch Voice AI (Vapi)
- Achieve £22,000-25,000 MRR
- Solo tier: 20+ customers
- 95%+ customer retention

---

### Q2 2026: April - June (Custom ML Models)

#### Theme: Predictive Intelligence

**Major Features:**

##### 13. Custom ML Models (HIGH PRIORITY) ⭐

**Problem:** Need proprietary AI models for competitive advantage
**Solution:** Develop 3 custom ML models using Knowledge Graph data

**Model 1: Demand Predictor**
- **Purpose:** Forecast order volumes 1-4 weeks ahead
- **Input:** Historical orders, seasonal patterns, cultural events, weather data
- **Output:** Predicted daily order volume with confidence interval
- **Use Case:** "Expect 25% increase in orders next week (cultural event detected)"

**Model 2: Anomaly Detector**
- **Purpose:** Detect unusual orders or business patterns
- **Input:** Order data, customer behavior, typical business patterns
- **Output:** Anomaly alerts with severity score
- **Use Case:** "Unusual order detected: £500 order from new customer (verify before fulfilling)"

**Model 3: Classification Engine**
- **Purpose:** Auto-categorize and prioritize orders
- **Input:** Order details, customer history, business rules
- **Output:** Category (Standard/Urgent/VIP), priority score
- **Use Case:** "This order requires urgent attention (VIP customer, tight deadline)"

**Success Metrics:**
- Demand forecast accuracy: 80%+
- Anomaly detection precision: 85%+
- Classification accuracy: 90%+
- 50%+ of customers trust and act on ML predictions

**Technical Requirements:**
- Python ML backend (TensorFlow or PyTorch)
- Model training pipeline
- Neo4j Knowledge Graph integration
- A/B testing framework

**Timeline:** 8-10 weeks
**Priority:** P0 (Critical - Differentiation)

---

##### 14. Mobile Native Apps (iOS & Android) (MEDIUM-HIGH PRIORITY)

**Problem:** Mobile web works, but native apps provide better UX
**Solution:** Launch native iOS and Android apps

**Features:**
- Native iOS and Android apps (React Native)
- Push notifications for new orders
- Offline mode (view orders, sync when online)
- Camera integration for product photos
- Barcode scanning for inventory
- Touch ID/Face ID authentication
- App Store and Google Play presence

**Success Metrics:**
- 60%+ of customers download mobile app
- 4.5+ star rating on app stores

**Timeline:** 8-10 weeks
**Priority:** P1 (High - User Experience)

---

**Q2 2026 Business Goals:**
- Reach 110 total customers
- Custom ML models deployed
- Mobile apps launched (iOS + Android)
- Achieve £32,000-35,000 MRR
- 95%+ customer retention

---

### Q3-Q4 2026: July - December (Scaling to 150 Customers)

**Major Features:**
- Multi-location support (for growing businesses)
- Third-party integrations (Zapier, accounting software, delivery services)
- Advanced analytics and reporting
- Customer portal (for end-customer order tracking)

**Q3-Q4 2026 Business Goals:**
- **Reach 150 total customers (Year 2 Target Achieved)** ✅
- **Achieve £36,500 MRR, £300,000 ARR** ✅
- **LTV:CAC Ratio: 23:1** ✅
- Expand to 5 cities across UK
- Raise Seed round (£1.5M target)
- 50% net profit margin

---

## Phase 4: Year 3 - Enterprise & Platform (2027)

**Timeline:** Q1-Q4 2027
**Status:** 📋 PLANNED
**Goal:** Scale to 400 customers, enterprise features, £780,000 ARR

### Business Targets (Year 3)

| Metric | Target |
|--------|--------|
| **Total Customers** | 400 |
| **MRR** | £97,500 |
| **ARR** | £780,000 |
| **ARPU** | £294/month |
| **CAC** | £150 |
| **LTV:CAC Ratio** | 23:1 |
| **Net Margin** | 37% |

**Major Features (Year 3):**
- **Enterprise Team Management:** Advanced roles, shift scheduling, performance analytics
- **Public API & Developer Platform:** RESTful API, webhooks, SDKs (JavaScript, Python)
- **Marketplace:** Third-party apps and integrations
- **Advanced Financial Management:** Profit margin analysis, cash flow forecasting, tax reporting
- **White-Label Options:** For partners and resellers

---

## Customer Acquisition & Growth Milestones

### Customer Targets (Aligned with Business Plan v6.3)

| Phase | Timeframe | Customers | MRR | ARR | Key Features |
|-------|-----------|-----------|-----|-----|--------------|
| **MVP** | Dec 2024 | 1 | £0 | £0 | Multi-channel, AI insights |
| **Year 1** | Dec 2025 | **45** | **£13,250** | **£84,400** | Neo4j, WhatsApp API, n8n |
| **Year 2** | Dec 2026 | **150** | **£36,500** | **£300,000** | Voice AI (Vapi), ML Models, Mobile Apps |
| **Year 3** | Dec 2027 | **400** | **£97,500** | **£780,000** | Enterprise, API Platform, Marketplace |

### Geographic Expansion

**Year 1 (2025):** London, Birmingham, Manchester (45 customers)
**Year 2 (2026):** Leeds, Bristol, Liverpool, Nottingham, Sheffield (150 customers)
**Year 3 (2027):** National coverage - all major UK cities (400 customers)

---

## Technology Evolution Roadmap

### Infrastructure Scaling

**Year 1 (2025):**
- Vercel Pro plan
- Supabase Pro tier
- **Neo4j Cloud:** £200-300/month
- **n8n:** Self-hosted, £50-100/month
- Sentry (error monitoring)
- Redis (caching)

**Year 2 (2026):**
- Vercel Enterprise
- Supabase Team tier
- **Vapi:** Variable cost (£0.12-0.18/min)
- **Python ML Backend:** AWS/GCP (£500-1,000/month)
- CDN optimization
- Background job processing (Inngest)

**Year 3 (2027):**
- Multi-region database (Supabase)
- Kubernetes migration (optional)
- Data warehouse (BigQuery) for analytics
- Event-driven architecture (Kafka/RabbitMQ)

### Proprietary Technology Stack (Competitive Moat)

**Neo4j Knowledge Graph (Year 1):**
- 47 entity types, 89 relationship types
- "SMEs like you" recommendations
- Sector-specific pattern detection
- **Competitive Advantage:** 3+ years to replicate

**Custom ML Models (Year 2):**
- Demand Predictor, Anomaly Detector, Classification Engine
- Trained on proprietary Knowledge Graph data
- **Competitive Advantage:** Data flywheel effect

**Voice AI (Vapi) (Year 2):**
- 24/7 voice ordering and appointment booking
- Multi-language support
- **Competitive Advantage:** First-mover in UK SME voice AI

**Orchestration Engine (Year 2-3):**
- Proprietary integration layer coordinating AI models, channels, and workflows
- **Competitive Advantage:** Unique system architecture

---

## Pricing Structure

### Pricing Tiers

| Tier | Price | Target | Launch | Features |
|------|-------|--------|--------|----------|
| **Free Trial** | £0 (30 days) | All prospects | Year 1 | All features, limited duration |
| **Solo** | £150/month | Solopreneurs (1-2 employees) | Q1 2026 | 50 voice minutes, single user |
| **Starter** | £250/month | 5-15 employees | Year 1 | 100 voice minutes, team features |
| **Growth** | £350/month | 15-30 employees | Year 1 | 300 voice minutes, advanced analytics |

### Unit Economics (Conservative)

| Metric | Value | Rationale |
|--------|-------|-----------|
| **ARPU** | £294/month | Weighted avg (Solo £150, Starter £250, Growth £350) |
| **CAC** | £150 | Community-based vs industry £300-500 |
| **LTV** | £3,528 | ARPU £294 × 12 months |
| **LTV:CAC Ratio** | **23:1** | Conservative, accounts for churn |
| **Gross Margin** | ~75% | Low infrastructure costs |
| **Churn** | 5%/month | Target (industry: 5-7%) |

---

## Feature Prioritization Framework

### Priority Levels

**P0 (Critical):**
- Blocks customer acquisition or causes churn
- Competitive differentiation (Neo4j, Voice AI, ML Models)
- High customer demand (50%+ request it)

**P1 (High):**
- Significant customer value
- Requested by 30-50% of customers
- Supports business growth

**P2 (Medium):**
- Nice-to-have, enhances experience
- Requested by 10-30% of customers

**P3 (Low):**
- Experimental or future-looking
- Requested by <10% of customers

---

## Success Metrics & KPIs

### Product Metrics

**Customer Acquisition:**
- Year 1: 45 customers (£150 CAC)
- Year 2: 150 customers (£150 CAC)
- Year 3: 400 customers (£150 CAC)
- Activation rate: 90%+ (first order within 7 days)

**Engagement:**
- Daily Active Users: 80%+
- Weekly Active Users: 95%+
- Average orders processed per customer: 20-30/day

**Retention:**
- Monthly retention: 95%+
- Annual retention: 90%+
- Churn rate: <5%/month

**Product Usage:**
- WhatsApp integration adoption: 70%+ (Year 1)
- Voice AI adoption: 50%+ (Year 2)
- Knowledge Graph insights: 60%+ find valuable (Year 1)
- Mobile app adoption: 60%+ (Year 2)

### Business Metrics

**Revenue:**
- Year 1: £84,400 ARR, 62% net margin
- Year 2: £300,000 ARR, 50% net margin
- Year 3: £780,000 ARR, 37% net margin

**Unit Economics:**
- ARPU: £294/month
- CAC: £150
- LTV: £3,528
- LTV:CAC ratio: 23:1
- Gross margin: 75%+

---

## Risk Management & Mitigation

### Technology Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Neo4j deployment delays** | High | Medium | Start early, hire Neo4j consultant |
| **Vapi voice accuracy issues** | High | Medium | Extensive testing, fallback to human |
| **WhatsApp API approval delays** | Medium | High | Apply early, have manual fallback |
| **ML model accuracy below target** | Medium | Medium | A/B testing, human review loop |

### Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Slower customer acquisition (Year 1)** | High | Medium | Increase marketing, improve sales process |
| **Higher churn than expected** | High | Medium | Proactive customer success, onboarding |
| **Vapi costs exceed budget (Year 2)** | Medium | Medium | Monitor usage, optimize voice workflows |
| **Fundraising delays (Year 2)** | Medium | Low | Bootstrap longer, focus on profitability |

---

## Competitive Advantages (Defensibility)

1. **Neo4j Knowledge Graph (3+ years to replicate):**
   - Proprietary schema: 47 entities, 89 relationships
   - Year 3: 400+ SMEs in graph = unmatched pattern intelligence

2. **Data Flywheel Effect:**
   - Customer 1 → basic AI insights
   - Customer 100 → "SMEs like you" recommendations
   - Customer 400 → predictive intelligence

3. **Community Distribution (£150 CAC vs £300-500 industry):**
   - 70+ community partnerships
   - Word-of-mouth within tight-knit communities

4. **First-Mover in Voice AI for UK SMEs:**
   - Vapi integration (Year 2)
   - Multi-language support (English, Yoruba, Twi, Polish)

5. **Sector Depth (10 high-value sectors):**
   - 18+ months real-world learning encoded in Knowledge Graph

6. **Switching Costs:**
   - 6-12 months historical data in Knowledge Graph
   - Voice AI trained on customer's patterns

7. **Price Point Protection (£150-350):**
   - Too low for enterprise vendors (Toast, Square)
   - Affordable for SMEs (5-50 employees)

---

## Conclusion

This 18-month roadmap balances ambitious growth targets with pragmatic execution:

**Year 1 (2025):** Foundation - 45 customers, Neo4j Knowledge Graph, WhatsApp API
**Year 2 (2026):** Voice AI - 150 customers, Vapi integration, Custom ML Models
**Year 3 (2027):** Enterprise - 400 customers, API Platform, £780K ARR

**Critical Success Factors:**
1. Deploy Neo4j Knowledge Graph (Year 1) - proprietary data advantage
2. Launch Voice AI with Vapi (Year 2) - major differentiation
3. Achieve 45 customers by end of Year 1 - prove scalability
4. Maintain 90%+ retention - validate product-market fit
5. LTV:CAC ratio >20:1 - demonstrate unit economics

**The roadmap aligns with Business Plan v6.3 and positions Àpínlẹ̀rọ as the leading AI-powered operations platform for UK SMEs across 10 high-value sectors.**

---

**Document Owner:** Chief Product Officer
**Contributors:** Engineering, Customer Success, Sales, Finance
**Last Review:** December 2024
**Next Review:** March 2025 (quarterly roadmap review)

*This document is confidential and proprietary to Àpínlẹ̀rọ.*
