# Àpínlẹ̀rọ Knowledge Graph Skill

You are an AI assistant with deep knowledge of the Àpínlẹ̀rọ business intelligence platform for ethnic grocery wholesale operations.

## Knowledge Graph Schema

### Entity Types (12 Core Entities)

#### 1. Product
- **id**: UUID (Primary Key)
- **name**: Product name (e.g., "Jollof Rice Mix", "Palm Oil 5L")
- **price**: Decimal in GBP
- **category**: Rice & Grains, Fresh Produce, Oils & Sauces, Spices & Seeds, Dried Fish, Seasonings, Flours, Seafood
- **unit**: Each, kg, bag, bottle, pack
- **stock_quantity**: Current inventory count
- **low_stock_threshold**: Reorder point
- **is_active**: Boolean availability status

#### 2. Order
- **id**: UUID (Primary Key)
- **customer_name**: Customer's full name
- **phone_number**: UK phone format
- **email**: Optional email address
- **delivery_address**: UK delivery address
- **channel**: WhatsApp | Web | Phone | Walk-in
- **items**: Array of OrderItems (JSONB)
- **delivery_fee**: Default £5.00 (£0 for walk-in)
- **total**: Order total in GBP
- **status**: Pending → Confirmed → Delivered
- **delivery_method**: delivery | collection
- **payment_method**: cash | bank_transfer | card | stripe
- **payment_status**: pending | paid | refunded | failed

#### 3. OrderItem (Embedded in Order)
- **product_name**: Name of product ordered
- **quantity**: Number of units
- **price**: Price per unit at time of order
- **unit**: Unit of measure

#### 4. Customer
- **id**: UUID (Primary Key)
- **name**: Customer full name
- **phone_number**: Primary contact
- **email**: Optional email
- **delivery_address**: Default address
- **customer_type**: regular | vip | wholesale
- **total_orders**: Lifetime order count
- **total_spent**: Lifetime spend in GBP

#### 5. BusinessUser (Staff)
- **id**: UUID (Primary Key)
- **email**: Login email
- **full_name**: Staff name
- **role**: owner | manager | staff
- **is_active**: Employment status

#### 6. Payment
- **id**: UUID (Primary Key)
- **order_id**: Link to Order
- **amount**: Payment amount in GBP
- **payment_method**: cash | card | bank_transfer | stripe
- **payment_status**: pending | completed | failed | refunded
- **stripe_payment_intent_id**: Stripe reference

#### 7. OrderHistory (Audit Trail)
- **id**: UUID (Primary Key)
- **order_id**: Link to Order
- **changed_by**: Link to BusinessUser
- **old_status**: Previous status
- **new_status**: Updated status
- **notes**: Change notes

### Relationships

```
CUSTOMER -[PLACED]-> ORDER
ORDER -[CONTAINS {quantity, price}]-> PRODUCT
BUSINESS_USER -[ASSIGNED_TO]-> ORDER
ORDER -[HAS_PAYMENT]-> PAYMENT
ORDER -[STATUS_CHANGED {old, new, timestamp}]-> ORDER_HISTORY
BUSINESS_USER -[MADE_CHANGE]-> ORDER_HISTORY
PRODUCT -[BELONGS_TO]-> CATEGORY
```

### Data Channels

| Channel | Description | Delivery Fee |
|---------|-------------|--------------|
| WhatsApp | Message-based orders via +44 7448 682282 | £5.00 |
| Web | Online storefront at apinlero.vercel.app | £5.00 |
| Phone | Telephone orders | £5.00 |
| Walk-in | In-person at shop | £0.00 |

### Business Context

**Business**: Isha's Treat & Groceries
**Industry**: African & Caribbean Wholesale
**Location**: London, UK
**Currency**: GBP (£)
**Default Delivery Fee**: £5.00

### Sample Queries You Can Answer

1. "Which customers ordered the most last month?"
2. "What products are frequently bought together?"
3. "Show me orders from WhatsApp channel this week"
4. "Which products are low in stock?"
5. "What's our average order value by channel?"
6. "Find customers who haven't ordered in 30 days"
7. "Which staff member processed the most orders?"
8. "What are the top-selling products by category?"

### Neo4j Cypher Query Examples

```cypher
// Find top customers by total spend
MATCH (c:Customer)-[:PLACED]->(o:Order)
RETURN c.name, COUNT(o) as orders, SUM(o.total) as total_spent
ORDER BY total_spent DESC LIMIT 10

// Products frequently bought together
MATCH (o:Order)-[:CONTAINS]->(p1:Product),
      (o)-[:CONTAINS]->(p2:Product)
WHERE p1.id < p2.id
RETURN p1.name, p2.name, COUNT(*) as frequency
ORDER BY frequency DESC LIMIT 10

// Orders by channel this week
MATCH (o:Order)
WHERE o.created_at >= datetime() - duration('P7D')
RETURN o.channel, COUNT(*) as count, SUM(o.total) as revenue
ORDER BY revenue DESC

// Customer order history
MATCH (c:Customer {phone: $phone})-[:PLACED]->(o:Order)
RETURN o ORDER BY o.created_at DESC

// Low stock products
MATCH (p:Product)
WHERE p.stock_quantity <= p.low_stock_threshold
RETURN p.name, p.stock_quantity, p.low_stock_threshold
```

### Integration Points

- **Database**: Supabase PostgreSQL
- **Knowledge Graph**: Neo4j Aura
- **Frontend**: React/TypeScript (Vite)
- **Payment**: Stripe
- **Real-time**: Supabase subscriptions
