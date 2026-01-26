#!/usr/bin/env node

/**
 * Execute Migrations via Direct PostgreSQL Connection
 * This uses the pg library to connect directly to Supabase's Postgres database
 */

const { Client } = require('pg');

// Supabase database connection details
// Get these from: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/settings/database
const connectionString = process.env.DATABASE_URL ||
  'postgresql://postgres.gafoezdpaotwvpfldyhc:[YOUR-PASSWORD]@aws-0-eu-west-2.pooler.supabase.com:6543/postgres';

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
   OR (name = 'African Nutmeg' AND price = 8.25)
RETURNING id, name, price;
`;

async function main() {
  console.log('🔧 Executing Supabase Migrations via Direct Connection...');
  console.log('=========================================\n');

  // Check if we have a valid connection string
  if (connectionString.includes('[YOUR-PASSWORD]')) {
    console.log('❌ Database password not configured!\n');
    console.log('To get your database password:');
    console.log('1. Go to: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/settings/database');
    console.log('2. Look for "Connection string" or "Database Password"');
    console.log('3. Either:');
    console.log('   a) Set DATABASE_URL environment variable with the full connection string');
    console.log('   b) Update the connectionString in this script');
    console.log('\nOr run the SQL manually in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/sql/new\n');

    console.log('=========================================');
    console.log('SQL to run:');
    console.log('=========================================\n');
    console.log('-- Step 1: Fix RLS Policy');
    console.log(RLS_FIX_SQL);
    console.log('\n-- Step 2: Clean up placeholders');
    console.log(CLEANUP_SQL);

    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    // Execute RLS fix
    console.log('📋 Step 1: Fixing RLS policies...');
    await client.query(RLS_FIX_SQL);
    console.log('✅ RLS policies fixed!\n');

    // Execute cleanup
    console.log('📋 Step 2: Cleaning up placeholder products...');
    const result = await client.query(CLEANUP_SQL);
    console.log(`✅ Deleted ${result.rowCount} placeholder products!\n`);

    if (result.rows.length > 0) {
      console.log('Deleted products:');
      result.rows.forEach(row => {
        console.log(`  - ${row.name} (${row.price})`);
      });
      console.log('');
    }

    console.log('=========================================');
    console.log('✅ All migrations completed successfully!');
    console.log('=========================================\n');

    console.log('Next steps:');
    console.log('1. Test adding a product at https://app.apinlero.com');
    console.log('2. Verify placeholder products are gone');
    console.log('3. Confirm product uploads work\n');

  } catch (error) {
    console.error('❌ Error executing migrations:');
    console.error(error.message);
    console.error('\nIf you see authentication errors, you may need to:');
    console.error('1. Reset your database password in Supabase');
    console.error('2. Run the SQL manually in the dashboard\n');
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
