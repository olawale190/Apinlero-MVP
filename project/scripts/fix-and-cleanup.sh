#!/bin/bash

# One-command fix for RLS and placeholder cleanup
# This script generates SQL and provides instructions for execution

set -e

echo "🔧 Supabase Migration Helper"
echo "==========================================="
echo ""

# Combined SQL for both migrations
SQL_COMBINED=$(cat <<'EOSQL'
-- Migration 1: Fix RLS Policy
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Create new permissive policies
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

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Migration 2: Delete placeholder products
DELETE FROM products
WHERE (name = 'Jollof Rice Mix' AND price = 8.50)
   OR (name = 'Plantain (Green)' AND price = 3.25)
   OR (name = 'Palm Oil (5L)' AND price = 25.00)
   OR (name = 'Egusi Seeds' AND price = 12.50)
   OR (name = 'Stockfish' AND price = 18.75)
   OR (name = 'Scotch Bonnet Peppers' AND price = 4.50)
   OR (name = 'Yam Flour' AND price = 6.99)
   OR (name = 'Maggi Seasoning' AND price = 3.50)
   OR (name = 'Cassava Flour' AND price = 5.75)
   OR (name = 'Dried Crayfish' AND price = 15.00)
   OR (name = 'Garden Eggs' AND price = 4.25)
   OR (name = 'Fufu Flour' AND price = 7.50)
   OR (name = 'Coconut Oil (1L)' AND price = 12.00)
   OR (name = 'Red Palm Oil' AND price = 22.50)
   OR (name = 'African Nutmeg' AND price = 8.25);

-- Show confirmation
SELECT 'RLS Policy Fixed and Placeholders Removed!' as status;
EOSQL
)

# Save to temp file
TEMP_SQL_FILE="/tmp/supabase-migrations.sql"
echo "$SQL_COMBINED" > "$TEMP_SQL_FILE"

echo "📝 SQL commands saved to: $TEMP_SQL_FILE"
echo ""
echo "🎯 OPTION 1: Quick Copy-Paste (Recommended)"
echo "==========================================="
echo "1. Open: https://supabase.com/dashboard/project/***REMOVED***/sql/new"
echo "2. Copy-paste this SQL and click Run:"
echo ""
echo "---SQL START---"
echo "$SQL_COMBINED"
echo "---SQL END---"
echo ""

echo "🎯 OPTION 2: Using Supabase CLI"
echo "==========================================="
echo "Run this command:"
echo ""
echo "  supabase db execute --file $TEMP_SQL_FILE --project-ref ***REMOVED***"
echo ""
echo "(You'll need to login first: supabase login)"
echo ""

echo "🎯 OPTION 3: Using psql (if you have DB password)"
echo "==========================================="
echo "Run:"
echo ""
echo "  psql 'postgresql://postgres.<PASSWORD>@db.***REMOVED***.supabase.co:5432/postgres' < $TEMP_SQL_FILE"
echo ""
echo "Get your password from: https://supabase.com/dashboard/project/***REMOVED***/settings/database"
echo ""

echo "==========================================="
echo "✅ After running the SQL:"
echo "   - Product uploads will work"
echo "   - Placeholder products will be removed"
echo "   - Test at: https://app.apinlero.com"
echo "==========================================="
