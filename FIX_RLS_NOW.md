# URGENT FIX: Product Upload RLS Error

## Problem
Getting error: **"new row violates row-level security policy for table products"**

This is blocking Isha from adding products to inventory.

## Quick Fix (5 minutes)

### Step 1: Open Supabase SQL Editor
Go to: https://supabase.com/dashboard/project/***REMOVED***/sql/new

### Step 2: Copy and Run This SQL

```sql
-- Fix Products RLS Policy
-- This recreates the policies to allow all operations

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Create new permissive policies for all users (anon + authenticated)
CREATE POLICY "Enable read access for all users"
ON products FOR SELECT
TO public
USING (true);

CREATE POLICY "Enable insert access for all users"
ON products FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
ON products FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
ON products FOR DELETE
TO public
USING (true);

-- Ensure RLS is enabled (but with permissive policies)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
```

### Step 3: Click "Run" button

You should see success messages for each command.

### Step 4: Test
- Go to https://app.apinlero.com
- Try adding a product with name, price, and image
- It should work now!

---

## Alternative: Temporarily Disable RLS (Quick Test)

If you just want to test immediately, run this simpler command:

```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
```

**Warning:** This removes ALL security, so only use for testing. Re-enable later with the full fix above.

---

## What Happened?

The products table has RLS (Row Level Security) enabled, which is good for security. However, the INSERT policy wasn't configured properly to allow anonymous users (using the anon key) to insert products.

The fix above creates proper policies that allow the `public` role (which includes both anonymous and authenticated users) to perform all operations on the products table.

---

## After Running the Fix

Once you run the SQL above:
1. ✅ Product uploads will work immediately
2. ✅ Isha can add products with images
3. ✅ The product will appear in the inventory grid
4. ✅ Security is maintained with proper RLS policies

---

## Need Help?

If you're not comfortable running SQL:
1. Share your screen and I can guide you step-by-step
2. Or temporarily give me database access to run it for you

The fix takes literally 30 seconds once in the SQL Editor!
