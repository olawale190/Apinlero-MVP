#!/bin/bash

# Execute Supabase Migrations
# This script runs the RLS fix and placeholder cleanup migrations

set -e

SUPABASE_URL="${SUPABASE_URL:-${VITE_SUPABASE_URL}}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Missing required environment variables"
    echo "   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY"
    exit 1
fi

echo "🔧 Executing Supabase Migrations..."
echo ""

# Function to execute SQL via Supabase REST API
execute_sql() {
    local sql="$1"
    local description="$2"

    echo "📋 Executing: $description"

    # Use the pg_meta API endpoint or direct SQL execution
    # Note: Supabase provides a REST API for SQL execution
    response=$(curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"query\":\"$sql\"}" \
        -s -w "\nHTTP_STATUS:%{http_code}")

    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)

    if [ "$http_status" = "200" ]; then
        echo "✅ Success!"
    else
        echo "⚠️  API endpoint may not be available"
        echo "Response: $response"
    fi

    echo ""
}

# Migration 1: Fix RLS Policy
echo "========================================="
echo "Migration 1: Fix Products RLS Policy"
echo "========================================="
echo ""

RLS_SQL=$(cat <<'EOF'
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

# Since the REST API approach may not work, let's use psql via connection string
# or provide instructions for manual execution

echo "⚠️  Note: Supabase doesn't expose a simple SQL execution endpoint via REST API."
echo "Instead, we'll use the PostgreSQL connection string."
echo ""

# Construct the connection string from environment variables
# Extract project ref from SUPABASE_URL
PROJECT_REF=$(echo "$SUPABASE_URL" | sed -n 's/.*\/\/\([^.]*\)\..*/\1/p')
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_NAME="postgres"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD}"
DB_PORT="${DB_PORT:-5432}"

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: DB_PASSWORD environment variable not set"
    echo "   Get it from: https://supabase.com/dashboard/project/${PROJECT_REF}/settings/database"
    exit 1
fi

CONNECTION_STRING="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# Check if psql is available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL client found. Executing migrations..."
    echo ""

    # Execute RLS fix
    echo "Executing RLS policy fix..."
    echo "$RLS_SQL" | psql "$CONNECTION_STRING" -q
    echo "✅ RLS policy fixed!"
    echo ""

    # Execute placeholder cleanup
    echo "Executing placeholder product cleanup..."
    CLEANUP_SQL=$(cat <<'EOF'
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
EOF
)

    echo "$CLEANUP_SQL" | psql "$CONNECTION_STRING" -q
    echo "✅ Placeholder products cleaned up!"
    echo ""

    echo "========================================="
    echo "✅ All migrations executed successfully!"
    echo "========================================="

else
    echo "❌ PostgreSQL client (psql) not found."
    echo ""
    echo "📝 Please run these SQL commands manually in Supabase SQL Editor:"
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed -n 's/.*\/\/\([^.]*\)\..*/\1/p')
    echo "   https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new"
    echo ""
    echo "========================================="
    echo "SQL Command 1: Fix RLS Policy"
    echo "========================================="
    echo "$RLS_SQL"
    echo ""
    echo "========================================="
    echo "SQL Command 2: Clean Up Placeholders"
    echo "========================================="
    cat <<'EOF'
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
EOF
    echo ""
fi
