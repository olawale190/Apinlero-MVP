#!/bin/bash

# Execute RLS Fix via Supabase REST API
# This uses the service role key to execute SQL commands

SUPABASE_URL="https://***REMOVED***.supabase.co"
SERVICE_ROLE_KEY="***REMOVED***"

echo "🔧 Fixing RLS Policy for Products Table..."
echo ""

# SQL commands to fix RLS
SQL=$(cat <<'EOF'
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;
CREATE POLICY "Enable read access for all users" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE TO public USING (true);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
EOF
)

# Execute via Supabase REST API
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\": \"${SQL}\"}"

echo ""
echo "✅ RLS policy fix attempted"
echo ""
echo "Note: If this didn't work, the REST API might not support direct SQL execution."
echo "Alternative: Run the SQL manually in Supabase Dashboard"
