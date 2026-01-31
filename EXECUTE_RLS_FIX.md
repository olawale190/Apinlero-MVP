# ✅ NEXT STEP: Fix RLS Policy

## What's Done
✅ **Placeholder products deleted** - All 15 sample products have been removed from the database

## What's Left
🔧 **RLS Policy Fix** - This requires running SQL in Supabase Dashboard (2 minutes)

---

## Quick Instructions

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/sql/new

### Step 2: Copy & Paste This SQL

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Create new permissive policies
CREATE POLICY "Enable read access for all users"
ON products FOR SELECT TO public USING (true);

CREATE POLICY "Enable insert access for all users"
ON products FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON products FOR UPDATE TO public USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON products FOR DELETE TO public USING (true);

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Step 3: Click "Run"

You should see success messages for each command.

### Step 4: Test

1. Go to https://app.apinlero.com
2. Try adding a product with name, price, and image
3. It should work immediately!

---

## What This Does

- **Drops old policies** that were blocking inserts
- **Creates new policies** that allow all operations (SELECT, INSERT, UPDATE, DELETE)
- **Enables RLS** while keeping operations permissive for the public role

---

## Why Manual Execution?

The database password has changed/expired, so automated execution isn't possible. Running it manually in the dashboard is the most reliable method and takes only ~30 seconds.

---

## After Running

✅ Product uploads will work
✅ No more RLS policy errors
✅ Isha can add products successfully
✅ Placeholder products are already removed
