# Àpínlẹ̀rọ Database Migrate

## Purpose
Run Supabase database migrations, create tables, and manage schema changes for Apinlero.

## Usage
```
/db-migrate
```

## Prerequisites
- Supabase project access
- SQL migration files in `project/` directory
- Supabase CLI installed (optional, for local development)

## Commands

| Command | Description |
|---------|-------------|
| `/db-migrate` | List available migrations |
| `/db-migrate run [file]` | Run a specific migration |
| `/db-migrate status` | Check migration status |
| `/db-migrate rollback [file]` | Rollback a migration |

## Available Migrations

| File | Purpose | Tables |
|------|---------|--------|
| `supabase_schema.sql` | Core application tables | products, orders, customers, payments |
| `supabase_whatsapp_migration_v2.sql` | WhatsApp multi-tenant | businesses, whatsapp_configs, message_logs |
| `supabase_rls_policies.sql` | Row Level Security | All tables |

## Running Migrations

### Method 1: Supabase Dashboard (Recommended)
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Paste migration SQL
5. Click **Run**

### Method 2: Supabase CLI
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Run migration
supabase db push
```

### Method 3: Direct Connection
```bash
# Using psql
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" \
  -f project/supabase_schema.sql
```

## Core Schema Tables

### products
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'each',
  category TEXT,
  stock_quantity INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 10,
  image_url TEXT,
  barcode TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  email TEXT,
  delivery_address TEXT,
  channel TEXT DEFAULT 'Web',
  items JSONB NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 5.00,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'Pending',
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT UNIQUE NOT NULL,
  email TEXT,
  address TEXT,
  postcode TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## WhatsApp Multi-Tenant Tables

### businesses
```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_email TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  monthly_message_limit INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### whatsapp_configs
```sql
CREATE TABLE whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT NOT NULL,
  provider TEXT DEFAULT 'meta',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Order

Run migrations in this order:
1. `supabase_schema.sql` - Core tables
2. `supabase_whatsapp_migration_v2.sql` - WhatsApp tables
3. `supabase_rls_policies.sql` - RLS policies

## Verification Queries

### Check Tables Exist
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### Check Row Counts
```sql
SELECT
  'products' as table_name, COUNT(*) as rows FROM products
UNION ALL SELECT
  'orders', COUNT(*) FROM orders
UNION ALL SELECT
  'customers', COUNT(*) FROM customers
UNION ALL SELECT
  'businesses', COUNT(*) FROM businesses;
```

### Check RLS is Enabled
```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Rollback Procedures

### Drop WhatsApp Tables
```sql
DROP TABLE IF EXISTS whatsapp_analytics_daily CASCADE;
DROP TABLE IF EXISTS whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_message_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_configs CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
```

### Reset a Table
```sql
TRUNCATE TABLE orders RESTART IDENTITY CASCADE;
```

## Troubleshooting

### "relation already exists"
**Cause:** Table already created
**Solution:** Use `CREATE TABLE IF NOT EXISTS` or drop first

### "violates foreign key constraint"
**Cause:** Referenced row doesn't exist
**Solution:** Create parent records first or use CASCADE

### "permission denied"
**Cause:** Using anon key instead of service role
**Solution:** Use service role key for migrations

### RLS blocking access
**Cause:** RLS enabled but no policies
**Solution:** Create appropriate policies or use service role key

## Backup Before Migration
```sql
-- Backup critical tables
CREATE TABLE orders_backup AS SELECT * FROM orders;
CREATE TABLE products_backup AS SELECT * FROM products;
```

## Related Skills
- `/db-seed` - Seed test data
- `/deploy-railway` - Deploy after schema changes

---
*Apinlero Database Migrate Skill v1.0*
