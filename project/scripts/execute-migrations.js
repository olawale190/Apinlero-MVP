#!/usr/bin/env node

/**
 * Execute Supabase Migrations
 * This script executes the RLS fix and placeholder cleanup using the service role key
 */

const https = require('https');

const SUPABASE_URL = 'https://gafoezdpaotwvpfldyhc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZm9lemRwYW90d3ZwZmxkeWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE3MTQ4NywiZXhwIjoyMDgwNzQ3NDg3fQ.o3iNhUEMQ5kUoRoEcu-YdAq8gFB9CHKtaHu9SsXD-VM';

// SQL for RLS fix
const RLS_FIX_SQL = `
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

-- Create new permissive policies
CREATE POLICY "Enable read access for all users" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE TO public USING (true);

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
`;

// SQL for placeholder cleanup
const CLEANUP_SQL = `
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
`;

/**
 * Execute SQL using Supabase REST API
 * Using the pg_meta or postgres REST endpoint
 */
async function executeSQL(sql, description) {
  console.log(`\n📋 ${description}...`);

  return new Promise((resolve, reject) => {
    // Try the postgres meta API endpoint
    const url = new URL(SUPABASE_URL);

    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: url.hostname,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Success!');
          resolve(data);
        } else {
          console.log(`⚠️  API returned status ${res.statusCode}`);
          console.log(`Response: ${data}`);

          // This endpoint might not exist, which is expected
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('⚠️  Request failed:', error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('🔧 Executing Supabase Migrations...');
  console.log('=========================================\n');

  console.log('⚠️  Note: The Supabase REST API does not expose a direct SQL execution endpoint.');
  console.log('⚠️  You need to run these SQL commands in the Supabase Dashboard.\n');

  console.log('📝 Instructions:');
  console.log('1. Go to: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/sql/new');
  console.log('2. Copy and run the SQL commands below');
  console.log('3. Click "Run" after each block\n');

  console.log('=========================================');
  console.log('SQL Command 1: Fix RLS Policy');
  console.log('=========================================');
  console.log(RLS_FIX_SQL);

  console.log('\n=========================================');
  console.log('SQL Command 2: Clean Up Placeholders');
  console.log('=========================================');
  console.log(CLEANUP_SQL);

  console.log('\n=========================================');
  console.log('After running both commands:');
  console.log('✅ Product uploads will work');
  console.log('✅ Placeholder products will be removed');
  console.log('✅ Real products will remain untouched');
  console.log('=========================================\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
