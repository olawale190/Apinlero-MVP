# Technical Architecture Document
## Àpínlẹ̀rọ - AI-Powered Operations Platform for UK SMEs

**Version:** 2.0 (Aligned with Business Plan v6.3)
**Date:** December 2024
**Status:** Production (TRL 6)
**Author:** Engineering Team

---

## Executive Summary

Àpínlẹ̀rọ is built on a modern, scalable cloud-native architecture designed to serve **UK SMEs across 10 high-value sectors** with a **horizontal platform approach**. The system integrates React, TypeScript, Supabase (PostgreSQL), **Neo4j Knowledge Graph**, and best-in-class AI APIs to provide enterprise-level multi-channel operations at SME-affordable pricing.

**Platform Tagline:** *"One Platform. Any Channel. Any Business."*

**Technology Readiness Level:** TRL 6 - Technology Demonstrated in Operational Environment
**Current Market:** Specialty Grocery (beachhead) + Logistics (founder experience)
**Expansion Markets:** Field Services, Client/Appointment, Operations/Logistics, E-commerce/Retail (10 high-value sectors)
**Live Environment:** Production with pilot customer (Isha's Treat & Groceries)
**Daily Active Usage:** 15+ orders processed daily
**Architectural Design:** Industry-agnostic core with plug-and-play sector templates

---

## System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Web App (React + TypeScript)                               │
│  - Unified Dashboard                                         │
│  - Multi-Channel Order Management                            │
│  - AI Daily Insights                                         │
│  - White-Label Storefront                                    │
│  - Voice AI Interface (Year 2)                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ HTTPS/WSS
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  Vercel Edge Network                                         │
│  - Static Asset Serving                                      │
│  - Edge Functions (Future)                                   │
│  - Global CDN                                                │
└──────────────────┬──────────────────────────────────────────┘
                   │ REST API + Real-time
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                       BACKEND LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Supabase Platform                                           │
│  ┌─────────────┬──────────────┬────────────┬──────────────┐│
│  │ PostgreSQL  │ Auth Service │ Storage    │ Realtime     ││
│  │ Database    │ (Future)     │ (Future)   │ Subscriptions││
│  └─────────────┴──────────────┴────────────┴──────────────┘│
│                                                              │
│  Automation & Workflows (Future)                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │    Workflow Automation                               ││
│  │ - Channel routing logic                                 ││
│  │ - Automated customer notifications                      ││
│  │ - Integration orchestration                             ││
│  └─────────────────────────────────────────────────────────┘│
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                   PROPRIETARY AI LAYER                       │
├─────────────────────────────────────────────────────────────┤
│  SME Operations Knowledge Graph (Neo4j) - PROPRIETARY        │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ - 47 Entity Types                                       ││
│  │ - 89 Relationship Types                                 ││
│  │ - SME operational patterns & domain knowledge           ││
│  │ - Sector-specific business rules                        ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Custom ML Models - PROPRIETARY                              │
│  ┌─────────────┬──────────────┬────────────────────────────┐│
│  │ Demand      │ Anomaly      │ Classification             ││
│  │ Predictor   │ Detector     │ Engine                     ││
│  └─────────────┴──────────────┴────────────────────────────┘│
│                                                              │
│  Orchestration Engine - PROPRIETARY                          │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ - Intelligent routing (which AI model for which input)  ││
│  │ - Context assembly (inject Knowledge Graph context)     ││
│  │ - Output synthesis (combine multiple models)            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Third-Party AI APIs (Components)                            │
│  ┌─────────────┬──────────────┬────────────────────────────┐│
│  │ Claude API  │ GPT-5 API    │ Gemini API                 ││
│  │ (Anthropic) │ (OpenAI)     │ (Google)                   ││
│  └─────────────┴──────────────┴────────────────────────────┘│
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    INTEGRATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  External Services                                           │
│  - WhatsApp Business API (Multi-channel capture)             │
│  - Stripe (Payments - Year 1 Q3)                            │
│  - QuickBooks API (Accounting sync - Year 1 Q4)             │
│  - Vapi (Voice AI - Year 2)                                 │
│  - Unsplash (Product Images - MVP)                          │
│  - SendGrid/AWS SES (Email - Phase 2)                       │
│  - Property Portals (Real Estate - Year 2)                  │
│  - Booking Systems (Healthcare - Year 2)                    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- **Framework:** React 18.3.1 (current MVP), Next.js (planned migration)
- **Language:** TypeScript 5.5.3
- **Build Tool:** Vite 5.4.2
- **Styling:** Tailwind CSS 3.4.1
- **State Management:** React Hooks (useState, useEffect, useContext)
- **Routing:** React Router (Phase 2)
- **Icons:** Lucide React 0.344.0

**Backend:**
- **Database (Operational):** PostgreSQL 15+ (via Supabase 2.57.4)
- **Database (Knowledge Graph):** **Neo4j** (Proprietary SME Operations Intelligence)
- **Backend-as-a-Service:** Supabase (PostgreSQL, Auth, Real-time, Storage)
- **Workflow Automation:** **n8n** (Planned - automation and integration orchestration)
- **Real-time:** Supabase Realtime (WebSocket)
- **Auth:** Supabase Auth (Phase 2)
- **Storage:** Supabase Storage (Phase 2)

**Proprietary AI Layer:**
- **Knowledge Graph:** **Neo4j** (Custom ontology - 47 entities, 89 relationships)
- **Custom ML Models:** Demand Predictor, Anomaly Detector, Classification Engine
- **Orchestration Engine:** Proprietary integration layer coordinating AI models and channels
- **Third-Party AI APIs:** Claude (Anthropic), GPT-4 (OpenAI), Gemini (Google) - as components

**Infrastructure:**
- **Hosting:** Vercel (Frontend)
- **Database Hosting:** Supabase Cloud (PostgreSQL), Neo4j Cloud (Knowledge Graph)
- **CDN:** Vercel Edge Network
- **SSL/TLS:** Automatic (Vercel + Supabase)

**Voice AI (Year 2):**
- **Provider:** **Vapi** (currently testing)
- **Use Cases:** 24/7 voice ordering, appointment booking for high-value sectors
- **Integration:** REST API + Webhook callbacks

**Payments:**
- **Gateway:** Stripe
- **SDK:** @stripe/stripe-js 8.6.0
- **Compliance:** PCI DSS Level 1 (via Stripe)

**Development:**
- **Version Control:** Git + GitHub
- **Code Quality:** ESLint 9.9.1, TypeScript strict mode
- **Package Manager:** npm
- **Environment Management:** dotenv

---

## Data Architecture

### Database Schema (PostgreSQL - Operational Data)

**Core Tables:**

```sql
┌──────────────────┐
│    products      │
├──────────────────┤
│ id (PK)          │
│ name             │
│ price            │
│ category         │
│ image_url        │
│ stock_quantity   │
│ is_active        │
│ created_at       │
└──────────────────┘
         │
         │ 1:N (via items JSONB)
         ↓
┌──────────────────┐
│     orders       │
├──────────────────┤
│ id (PK)          │
│ customer_name    │
│ phone_number     │
│ delivery_address │
│ channel          │  ← Multi-channel: WhatsApp, Web, Phone, Walk-in
│ items (JSONB)    │
│ delivery_fee     │
│ total            │
│ status           │
│ payment_status   │
│ payment_method   │
│ notes            │
│ created_at       │
│ updated_at       │
└──────────────────┘
         │
         │ 1:N
         ↓
┌──────────────────┐
│    payments      │
├──────────────────┤
│ id (PK)          │
│ order_id (FK)    │
│ amount           │
│ payment_method   │
│ payment_status   │
│ stripe_id        │
│ paid_at          │
│ created_at       │
└──────────────────┘
```

### Knowledge Graph Schema (Neo4j - Proprietary)

**Purpose:** Capture SME operational patterns, relationships, and domain knowledge to power proprietary AI insights.

**Graph Structure:**

```
(SME) -[:HAS_CUSTOMER]-> (Customer)
(Customer) -[:PLACED]-> (Order)
(Order) -[:CONTAINS]-> (Product)
(Product) -[:BELONGS_TO]-> (Category)
(Product) -[:SUPPLIED_BY]-> (Supplier)
(Order) -[:VIA_CHANNEL]-> (Channel)
(Order) -[:DELIVERED_TO]-> (Location)
(SME) -[:OPERATES_IN]-> (Sector)
(Sector) -[:HAS_TEMPLATE]-> (SectorTemplate)
(Order) -[:EXHIBITS_PATTERN]-> (SeasonalPattern)
(Customer) -[:EXHIBITS_BEHAVIOR]-> (BehaviorPattern)
```

**Entity Types (47 total):** SME, Customer, Order, Product, Category, Supplier, Channel, Location, Sector, SectorTemplate, SeasonalPattern, BehaviorPattern, InventoryLevel, DeliveryZone, PaymentMethod, etc.

**Relationship Types (89 total):** HAS_CUSTOMER, PLACED, CONTAINS, BELONGS_TO, SUPPLIED_BY, VIA_CHANNEL, DELIVERED_TO, OPERATES_IN, HAS_TEMPLATE, EXHIBITS_PATTERN, EXHIBITS_BEHAVIOR, etc.

**Data Flywheel:**
- Customer 1: Learn ethnic grocery expiry patterns
- Customer 10: Identify common supplier relationships
- Customer 100: Predict "SMEs like you typically need X"

### Data Flow

**Order Creation Flow:**
```
User Input → Validation (Zod) → Sanitization → Supabase Insert → Knowledge Graph Update → Real-time Update → UI Refresh
```

**AI Insights Calculation Flow:**
```
Orders Data → Knowledge Graph Query → Custom ML Models → Statistical Analysis → Orchestration Engine → UI Rendering
```

**Voice AI Flow (Year 2):**
```
Voice Call → Vapi API → Natural Language Processing → Intent Recognition → Knowledge Graph Context → Order/Booking Creation → Confirmation
```

---

## Proprietary AI Innovation (Competitive Advantage)

### Layer 1: SME Operations Knowledge Graph

**Technology:** Neo4j graph database with custom ontology

**Schema:**
- **47 Entity Types** (SME, Customer, Order, Product, Sector, etc.)
- **89 Relationship Types** (PLACED, CONTAINS, VIA_CHANNEL, EXHIBITS_PATTERN, etc.)

**Function:**
- Maps relationships between orders, customers, inventory, suppliers, seasonal patterns
- Encodes sector-specific business rules (e.g., ethnic grocery expiry management, wholesale pricing, trade callout urgency)
- Grows with each implementation, creating compounding competitive advantage

**Example Queries:**

```cypher
// Find similar SMEs to recommend best practices
MATCH (sme:SME {id: $smeId})-[:OPERATES_IN]->(sector:Sector)
MATCH (similarSme:SME)-[:OPERATES_IN]->(sector)
WHERE similarSme.revenue_range = sme.revenue_range
  AND similarSme.employee_count = sme.employee_count
RETURN similarSme, sector

// Detect demand patterns for inventory optimization
MATCH (sme:SME {id: $smeId})-[:HAS_CUSTOMER]->(customer)-[:PLACED]->(order)
      -[:CONTAINS]->(product)
WHERE order.created_at > datetime() - duration('P30D')
RETURN product.name, count(order) AS order_count, avg(order.total) AS avg_value
ORDER BY order_count DESC
LIMIT 10

// Identify seasonal patterns for demand forecasting
MATCH (order:Order)-[:EXHIBITS_PATTERN]->(pattern:SeasonalPattern)
WHERE order.sme_id = $smeId
  AND pattern.type = 'cultural_event'
RETURN pattern.name, count(order) AS spike_count, avg(order.total) AS avg_spike_value
```

### Layer 2: Custom ML Models (Proprietary)

**Demand Predictor:**
- **Function:** Forecasts order volumes using historical patterns + external signals (seasonality, cultural events)
- **Training Data:** Real SME operational data from pilot customers
- **Innovation:** Trained on ethnic grocery sector data, adjusts for cultural events (e.g., Eid, Christmas, Diwali)

**Anomaly Detector:**
- **Function:** Identifies unusual patterns (order drops, inventory discrepancies)
- **Innovation:** Custom threshold algorithms for SME scale
  - Learns each SME's unique patterns (e.g., "Tuesday is always slow for Restaurant X")
  - Adjusts for seasonality (December spike for grocery stores)
  - Weights recent data more heavily (business changed 3 months ago)

**Classification Engine:**
- **Function:** Auto-categorizes incoming orders/enquiries by type, urgency, required action
- **Use Cases:** Tag messages as "order", "inquiry", "complaint", "urgent callout", "routine booking"

### Layer 3: Orchestration Engine (Proprietary)

**Intelligent Routing:**
- Custom logic determining which AI model processes which input
- Example: Emergency HVAC callout → Classification Engine → Urgent tag → Priority notification

**Context Assembly:**
- Proprietary prompt engineering injecting Knowledge Graph context into LLM queries
- Example: "SMEs like [Name] typically see 35% increase in orders during [cultural event]"

**Output Synthesis:**
- Combines outputs from multiple models into actionable recommendations
- Example: Demand Predictor + Anomaly Detector → "Rice 5kg orders spiking (cultural event detected) + current stock low → Restock now"

### Third-Party AI Integration

**Best-in-Class LLM APIs (Components):**
- **Claude (Anthropic):** Natural language understanding, conversational interface
- **GPT-4 (OpenAI):** Generating human-readable summaries, message categorization
- **Gemini (Google):** Alternative provider for redundancy

**The Innovation Is The Integration:** Third-party AI provides raw language capability. Àpínlẹ̀rọ provides the SME-specific knowledge, context, and operational intelligence.

---

## Security Architecture

### Security Layers

**1. Transport Security:**
- TLS 1.3 for all connections
- HTTPS enforced (Vercel automatic)
- WSS for real-time subscriptions

**2. Application Security:**
- Input validation (Zod schemas)
- Output sanitization (prevents XSS)
- SQL injection prevention (parameterized queries)
- CSRF protection (SameSite cookies)
- Rate limiting (client-side, Phase 2: server-side)

**3. Database Security:**
- Row Level Security (RLS) policies (Supabase)
- Encrypted at rest (AES-256)
- Encrypted in transit (TLS)
- Regular automated backups
- Point-in-time recovery

**4. Knowledge Graph Security:**
- Access controls (Neo4j RBAC)
- Encrypted connections (TLS)
- Data isolation (tenant-specific subgraphs)
- Query auditing

**5. Authentication (Phase 2):**
- JWT-based authentication
- Secure password hashing (bcrypt)
- Multi-factor authentication (optional)
- Session management

**6. Payment Security:**
- PCI DSS Level 1 compliant (via Stripe)
- No card data stored locally
- Tokenization for card details
- 3D Secure support

**7. AI API Security:**
- Anonymized queries (no personal identifiers sent to third-party AI APIs)
- Data Processing Agreement with Anthropic/OpenAI/Google
- Option for EU data residency as platform scales

### Security Implementation

**Input Validation Example:**
```typescript
import { z } from 'zod';

const orderSchema = z.object({
  customer_name: z.string().min(2).max(100).trim(),
  phone_number: z.string().regex(/^\+?44\d{10}$/),
  items: z.array(orderItemSchema).min(1),
  total: z.number().positive().max(100000),
});

// Usage
const validated = orderSchema.parse(formData);
```

**Sanitization Example:**
```typescript
function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

**Row Level Security Example (Supabase):**
```sql
-- Only authenticated users can view orders
CREATE POLICY "Authenticated users can view orders"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## Scalability Architecture

### Current Capacity

**Supported Load:**
- Concurrent users: 1,000+
- Orders per day: 10,000+
- Database size: Unlimited (PostgreSQL)
- API requests: 500,000/day (Supabase free tier)
- Knowledge Graph: Millions of nodes/relationships (Neo4j)

### Scaling Strategy

**Horizontal Scaling:**
- **Frontend:** Vercel Edge Network (automatic)
- **Database (PostgreSQL):** Read replicas (Supabase Pro tier)
- **Database (Neo4j):** Clustering (Neo4j Enterprise)
- **Caching:** Redis (Phase 2)

**Vertical Scaling:**
- **Database:** Automatic with Supabase
- **Compute:** Serverless functions auto-scale

**Performance Optimizations:**

```typescript
// 1. Database Indexes (PostgreSQL)
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_channel ON orders(channel);

// 2. Knowledge Graph Indexes (Neo4j)
CREATE INDEX FOR (sme:SME) ON (sme.id);
CREATE INDEX FOR (order:Order) ON (order.created_at);
CREATE INDEX FOR (product:Product) ON (product.name);

// 3. Lazy Loading (React)
const ProductCard = lazy(() => import('./ProductCard'));
const AISummary = lazy(() => import('./AISummary'));

// 4. Memoization (React)
const ExpensiveComponent = memo(({ data }) => {
  // Component logic
});

// 5. Virtual Scrolling (Phase 2)
import { FixedSizeList } from 'react-window';
```

### Scaling Roadmap

**MVP → 50 Customers:**
- Current stack sufficient
- Supabase Free Tier
- Neo4j Free Tier

**50 → 200 Customers:**
- Upgrade to Supabase Pro (£25/month)
- Upgrade to Neo4j Aura Professional (£50/month)
- Add Redis caching (£10/month)

**200 → 1,000 Customers:**
- Supabase Team Tier (£100/month)
- Neo4j Aura Enterprise (£200/month)
- Dedicated Redis cluster (£50/month)

---

## API Architecture

### RESTful Endpoints (Supabase)

**Base URL:** `https://***REMOVED***.supabase.co/rest/v1`

**Core Endpoints:**

```
GET    /orders              - List all orders
POST   /orders              - Create new order
GET    /orders?id=eq.{id}   - Get single order
PATCH  /orders?id=eq.{id}   - Update order
DELETE /orders?id=eq.{id}   - Delete order

GET    /products            - List all products
POST   /products            - Create product
PATCH  /products?id=eq.{id} - Update product

GET    /customers           - List customers (Phase 2)
POST   /customers           - Create customer (Phase 2)
```

**Authentication:**
```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// All requests include:
headers: {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
}
```

**Real-time Subscriptions:**
```typescript
// Subscribe to order changes
const subscription = supabase
  .channel('orders-channel')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'orders' },
    (payload) => {
      console.log('Change received!', payload);
      // Update UI
    }
  )
  .subscribe();
```

### GraphQL Endpoints (Neo4j - Planned)

**Base URL:** `https://neo4j.apinlero.com/graphql` (Future)

**Example Query:**
```graphql
query GetSMEInsights($smeId: ID!) {
  sme(id: $smeId) {
    id
    name
    topProducts(limit: 10) {
      name
      orderCount
      avgValue
    }
    seasonalPatterns {
      name
      type
      spikeCount
    }
    similarSMEs {
      id
      name
      sector
    }
  }
}
```

---

## Deployment Architecture

### CI/CD Pipeline

```
Code Push (Git) → GitHub → Vercel Build → Deploy to Edge → Live
                                    ↓
                              Run Tests
                              Type Check
                              Build Assets
                              Optimize
```

**Deployment Process:**
1. Developer pushes to `main` branch
2. Vercel detects push via webhook
3. Automated build triggered
4. TypeScript compilation
5. Production build created
6. Deploy to Vercel Edge Network
7. Automatic SSL certificate
8. DNS propagation
9. Live in ~60 seconds

**Environment Variables:**

```bash
# Production (Vercel)
VITE_SUPABASE_URL=https://***REMOVED***.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEO4J_URI=neo4j+s://production.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=*** (secret)

# Development (Local)
VITE_SUPABASE_URL=https://***REMOVED***.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEO4J_URI=neo4j://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=local
```

### Monitoring & Observability

**Application Monitoring:**
- **Tool:** Sentry (Phase 2)
- **Metrics:** Error rate, performance, user flow
- **Alerts:** Email + Slack integration

**Infrastructure Monitoring:**
- **Vercel Analytics:** Page load time, Core Web Vitals
- **Supabase Dashboard:** Database performance, query analysis
- **Neo4j Monitoring:** Graph query performance, memory usage
- **Uptime Monitoring:** UptimeRobot (99.5% SLA)

**Logging:**

```typescript
// Structured logging
console.log({
  timestamp: new Date().toISOString(),
  level: 'INFO',
  message: 'Order created',
  orderId: order.id,
  userId: user.id,
  channel: order.channel,
});
```

---

## Disaster Recovery

### Backup Strategy

**Database Backups (PostgreSQL):**
- **Frequency:** Daily automated (Supabase)
- **Retention:** 30 days
- **Type:** Full database dump
- **Storage:** Supabase S3-compatible storage

**Knowledge Graph Backups (Neo4j):**
- **Frequency:** Daily automated
- **Retention:** 30 days
- **Type:** Full graph dump
- **Storage:** Neo4j Cloud backup

**Code Backups:**
- **Repository:** GitHub (private)
- **Branches:** main, development, feature/*
- **Tags:** Version releases

**Recovery Objectives:**
- **RTO (Recovery Time Objective):** 4 hours
- **RPO (Recovery Point Objective):** 1 hour
- **Data Loss Tolerance:** <24 hours of orders

**Disaster Recovery Plan:**
1. Detect outage (monitoring alerts)
2. Assess impact and root cause
3. Communicate with users (status page)
4. Restore from latest backup
5. Verify data integrity
6. Resume operations
7. Post-mortem analysis

---

## Technology Decisions & Rationale

### Why React?
- **Reason:** Industry standard, large ecosystem, component reusability
- **Alternative Considered:** Vue.js
- **Decision:** React's maturity and hiring pool

### Why TypeScript?
- **Reason:** Type safety reduces bugs, better IDE support
- **Alternative Considered:** JavaScript
- **Decision:** TypeScript catches 15% more bugs at compile time

### Why Supabase?
- **Reason:** PostgreSQL (proven), instant APIs, real-time built-in
- **Alternative Considered:** Firebase, AWS Amplify
- **Decision:** Open-source, no vendor lock-in, SQL flexibility

### Why Neo4j (Critical Decision)?
- **Reason:** Graph databases excel at capturing relationships and patterns (SME operational intelligence)
- **Alternative Considered:** PostgreSQL with JSON, MongoDB
- **Decision:** Neo4j's graph query language (Cypher) is ideal for "SMEs like you" recommendations and pattern detection
- **Competitive Advantage:** Proprietary Knowledge Graph schema is defensible IP

### Why n8n?
- **Reason:** Open-source workflow automation, visual editor, self-hostable
- **Alternative Considered:** Zapier (expensive), Make (SaaS lock-in)
- **Decision:** Open-source allows customization, lower cost at scale

### Why Vapi (Voice AI)?
- **Reason:** Best-in-class voice AI API, natural language understanding, low latency
- **Alternative Considered:** Twilio Voice, custom Whisper integration
- **Decision:** Vapi provides full voice AI stack (ASR, NLU, TTS) with simple API

### Why Vercel?
- **Reason:** Zero-config, edge network, automatic SSL
- **Alternative Considered:** Netlify, AWS, self-hosted
- **Decision:** Best developer experience, automatic optimizations

### Why Stripe?
- **Reason:** Industry leader, PCI compliance, UK support
- **Alternative Considered:** PayPal, Square
- **Decision:** Best API, most reliable, lowest fees

---

## Future Technical Roadmap

### Year 1: Foundation & Validation (Current)

**Q1-Q2 2025:**
- ✅ MVP live with Isha's Treat & Groceries
- ✅ Multi-channel capture (WhatsApp, Web, Phone, Walk-in)
- ✅ AI Daily Insights (basic)
- ⏳ Sector Templates v1 (Retail/Grocery, Logistics)
- ⏳ Message Categorization (AI)

**Q3-Q4 2025:**
- Stripe Payments integration
- QuickBooks accounting sync
- Advanced Anomaly Detection (refine ML models)
- LOI conversions (Security, Healthcare, Cleaning templates)

### Year 2: Intelligence & Expansion (2026)

**Q1-Q2 2026:**
- Solo tier launch (£150/month)
- Hire AI Engineer (UK-based, full-time)
- **Voice AI Beta Launch** (Vapi integration)
- Healthcare/Real Estate templates
- Property portals integration (Real Estate)
- Booking systems integration (Healthcare)

**Q3-Q4 2026:**
- **Voice AI Full Launch** (24/7 voice ordering and appointment booking)
- Basic Job Assignment (Field Services)
- Improved AI accuracy (continuous feedback loop)
- 150 customers, £36,500 MRR

### Year 3: Scale & Market Leadership (2027)

**Q1-Q2 2027:**
- **Cross-Sector Insights** ("SMEs like you" benchmarking based on Knowledge Graph)
- Recommendation Engine (AI suggestions based on patterns from 220+ customers)
- Full Template Library (6-8 sectors)
- Enhanced Job Scheduling (priority handling, automated ETAs)

**Q3-Q4 2027:**
- **Multi-Language Voice AI** (support multiple languages)
- Full Ecosystem Integrations (manufacturing systems, community platforms)
- Industry Benchmark Reports (public reports showcasing SME operational data)
- Advanced Predictive Analytics (demand forecasting, inventory optimization)
- 400 customers, £96,000 MRR, 10 UK employees

### Phase 4 (2028+)

- **Multi-Region Deployment:** Ireland, Canada, Australia
- **GraphQL API:** Public API for third-party integrations
- **Advanced Analytics:** BigQuery integration for large-scale data analysis
- **Kubernetes Migration:** Fine-grained control for enterprise customers
- **Microservices Architecture:** Service decomposition for scale
- **Event-Driven Architecture:** Kafka/RabbitMQ for real-time event processing

---

## Compliance & Standards

**Security Standards:**
- OWASP Top 10 compliance
- SOC 2 Type II (via Supabase/Vercel)
- ISO 27001 (via Supabase/Vercel)

**Data Protection:**
- UK GDPR compliant
- Data Protection Act 2018 compliant
- Right to erasure implemented
- Data portability supported

**Payment Standards:**
- PCI DSS Level 1 (via Stripe)
- Strong Customer Authentication (SCA)
- 3D Secure 2.0 support

**AI Ethics:**
- Transparency: Clear disclosure that AI is used
- Human Oversight: Significant recommendations flagged for review
- Data Usage: SME data only for their benefit; No cross-customer training without consent

---

## Performance Benchmarks

**Current Production Metrics (Pilot - Isha's Treat):**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Page Load Time | <2s | 1.2s | ✅ |
| Time to Interactive | <3s | 2.1s | ✅ |
| First Contentful Paint | <1.5s | 0.9s | ✅ |
| API Response Time | <500ms | 220ms | ✅ |
| Database Query Time (PostgreSQL) | <100ms | 45ms | ✅ |
| Knowledge Graph Query Time (Neo4j) | <200ms | TBD (Phase 2) | ⏳ |
| Uptime | 99.5% | 99.8% | ✅ |

---

## Appendices

### Appendix A: Technology Versions

| Technology | Version | Release Date |
|-----------|---------|--------------|
| React | 18.3.1 | Apr 2024 |
| TypeScript | 5.5.3 | Jul 2024 |
| Vite | 5.4.2 | Sep 2024 |
| Supabase JS | 2.57.4 | Nov 2024 |
| Neo4j | 5.x (Cloud) | 2024 |
| n8n | Latest | TBD |
| Vapi | Latest | Year 2 |
| Stripe JS | 8.6.0 | Nov 2024 |
| Tailwind CSS | 3.4.1 | Jan 2024 |

### Appendix B: Infrastructure Costs

**Monthly Costs (Estimated):**

| Service | Free Tier | Pro Tier | Scale Tier |
|---------|-----------|----------|------------|
| **Vercel Hosting** | £0 (Hobby) | £20 (Pro) | £40+ (Team) |
| **Supabase (PostgreSQL)** | £0 (Free) | £25 (Pro) | £100+ (Team) |
| **Neo4j (Knowledge Graph)** | £0 (Free) | £50 (Aura Pro) | £200+ (Enterprise) |
| **n8n (Self-hosted)** | £10 (VPS) | £10 (VPS) | £50+ (Cloud) |
| **Stripe** | 1.5% + £0.20 per transaction | 1.5% + £0.20 | 1.5% + £0.20 |
| **Domain** | - | £10/year | £10/year |

**Total Monthly Cost:**
- **MVP (0-50 customers):** £10-20/month
- **Growth (50-200 customers):** £105/month
- **Scale (200-1000 customers):** £400/month

---

## Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | December 2024 | Engineering Team | Initial architecture (basic stack) |
| **2.0** | **December 2024** | **Engineering Team** | **Complete rewrite to align with Business Plan v6.3: Added Neo4j Knowledge Graph, n8n automation, Vapi Voice AI, proprietary AI layers, horizontal SME platform architecture** |

---

**Document Owner:** Chief Technology Officer
**Last Review:** December 2024
**Next Review:** March 2025

*This document is confidential and proprietary to Àpínlẹ̀rọ (Lazrap Ltd).*
