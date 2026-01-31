#!/bin/bash
echo "🔍 Checking migration status..."
echo ""

# Check if business_id columns exist
psql "postgresql://postgres:y2KyN58yVFnDh2wi@db.gafoezdpaotwvpfldyhc.supabase.co:5432/postgres" << SQL
-- Check for business_id columns
SELECT 
    table_name, 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns
WHERE column_name = 'business_id'
AND table_name IN ('products', 'customers', 'orders')
ORDER BY table_name;

-- Check if businesses table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'businesses'
) AS businesses_table_exists;

-- Check RLS status
SELECT 
    tablename, 
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE tablename IN ('products', 'customers', 'orders')
ORDER BY tablename;
SQL

echo ""
echo "✅ Check complete!"
