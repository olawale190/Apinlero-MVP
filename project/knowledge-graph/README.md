# Àpínlẹ̀rọ Knowledge Graph

AI-powered knowledge graph for ethnic grocery wholesale operations, connecting Supabase PostgreSQL to Neo4j Aura.

## Architecture

```
┌─────────────────┐     ETL      ┌─────────────────┐
│   Supabase      │ ──────────▶  │   Neo4j Aura    │
│   PostgreSQL    │              │   Graph DB      │
└─────────────────┘              └─────────────────┘
        │                                │
        │                                │
        ▼                                ▼
┌─────────────────┐              ┌─────────────────┐
│  React Frontend │              │  Claude Skill   │
│  (Vercel)       │              │  (AI Queries)   │
└─────────────────┘              └─────────────────┘
```

## Setup

### 1. Create Neo4j Aura Instance (Free)

1. Go to https://console.neo4j.io
2. Sign up / Log in
3. Create a new "AuraDB Free" instance
4. Save the connection details:
   - URI: `neo4j+s://xxxxxxxx.databases.neo4j.io`
   - Username: `neo4j`
   - Password: (generated password)

### 2. Configure Environment

```bash
cd knowledge-graph
cp .env.example .env
```

Edit `.env` with your credentials:
```
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USER=neo4j
NEO4J_PASSWORD=your-password
SUPABASE_URL=https://hxuzzhtjmpkhhmefajde.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Test Connections

```bash
npm run test
```

### 5. Setup Graph Schema

```bash
npm run setup
```

This creates:
- Node constraints (unique IDs)
- Indexes for fast queries
- Relationship types

### 6. Sync Data

```bash
npm run sync
```

This syncs:
- Products → :Product nodes
- Orders → :Order nodes
- Customers → :Customer nodes (extracted from orders)
- Categories → :Category nodes
- Staff → :Staff nodes
- All relationships

### 7. Run Queries

```bash
npm run query
```

## Graph Schema

### Node Labels

| Label | Description | Key Properties |
|-------|-------------|----------------|
| `:Product` | Products in catalog | id, name, price, category, stock |
| `:Order` | Customer orders | id, total, status, channel |
| `:Customer` | Customers | phone, name, total_orders |
| `:Category` | Product categories | name |
| `:Staff` | Business users | id, email, role |
| `:Payment` | Payment records | id, amount, status |

### Relationships

| Relationship | From → To | Properties |
|--------------|-----------|------------|
| `[:PLACED]` | Customer → Order | - |
| `[:CONTAINS]` | Order → Product | quantity, price |
| `[:BELONGS_TO]` | Product → Category | - |
| `[:ASSIGNED_TO]` | Staff → Order | - |
| `[:HAS_PAYMENT]` | Order → Payment | - |

## Sample Cypher Queries

### Top Customers
```cypher
MATCH (c:Customer)-[:PLACED]->(o:Order)
RETURN c.name, COUNT(o) as orders, SUM(o.total) as spent
ORDER BY spent DESC LIMIT 10
```

### Products Bought Together
```cypher
MATCH (o:Order)-[:CONTAINS]->(p1:Product),
      (o)-[:CONTAINS]->(p2:Product)
WHERE p1.id < p2.id
RETURN p1.name, p2.name, COUNT(*) as freq
ORDER BY freq DESC LIMIT 10
```

### Revenue by Channel
```cypher
MATCH (o:Order)
RETURN o.channel, COUNT(o), SUM(o.total)
ORDER BY SUM(o.total) DESC
```

### Customer Journey
```cypher
MATCH path = (c:Customer)-[:PLACED]->(o:Order)-[:CONTAINS]->(p:Product)
WHERE c.phone = '07xxx'
RETURN path
```

## Claude Skill Integration

The Claude skill file is at `.claude/skills/apinlero-knowledge-graph.md`.

It enables Claude to:
- Understand the graph schema
- Answer questions about customers, orders, products
- Generate Cypher queries
- Provide business insights

### Example Prompts

- "Which customers ordered the most last month?"
- "What products are frequently bought together?"
- "Show me orders from WhatsApp channel"
- "Which products are low in stock?"
- "What's our average order value by channel?"

## Automated Sync

For production, set up a cron job or scheduled function:

```bash
# Run sync every hour
0 * * * * cd /path/to/knowledge-graph && npm run sync >> sync.log 2>&1
```

Or use Supabase Edge Functions with webhooks to trigger sync on data changes.

## Troubleshooting

### Connection Failed
- Check `.env` credentials
- Verify Neo4j Aura instance is running
- Check Supabase project is active

### Sync Errors
- Ensure schema is set up first (`npm run setup`)
- Check Supabase RLS allows service role access
- Verify data types match constraints

### Query Errors
- Run `npm run setup` to ensure indexes exist
- Check node labels match (case-sensitive)
