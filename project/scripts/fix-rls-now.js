#!/usr/bin/env node

/**
 * Fix RLS Policy Using Direct PostgreSQL Connection
 */

import pg from 'pg';
const { Client } = pg;

// Supabase database connection
// Using direct database connection (not pooler)
const connectionConfig = {
  host: 'db.gafoezdpaotwvpfldyhc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  // Password needs to be set via environment or parameter
  password: process.env.SUPABASE_DB_PASSWORD || 'y2KyN58yVFnDh2wi',
  ssl: { rejectUnauthorized: false }
};

const RLS_FIX_SQL = `
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
`;

async function fixRLS() {
  console.log('🔧 Fixing RLS Policy via PostgreSQL Connection...');
  console.log('=========================================\n');

  const client = new Client(connectionConfig);

  try {
    console.log('📡 Connecting to database...');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📋 Executing RLS policy fix...');
    await client.query(RLS_FIX_SQL);
    console.log('✅ RLS policies fixed!\n');

    console.log('=========================================');
    console.log('✅ All migrations completed successfully!');
    console.log('=========================================\n');

    console.log('Next steps:');
    console.log('1. Test adding a product at https://app.apinlero.com');
    console.log('2. Verify placeholder products are gone');
    console.log('3. Confirm product uploads work\n');

  } catch (error) {
    console.error('❌ Error executing RLS fix:');
    console.error(error.message);

    if (error.message.includes('authentication') || error.message.includes('password')) {
      console.error('\n⚠️  Database password may be incorrect or expired.');
      console.error('Please run the SQL manually in Supabase Dashboard:');
      console.error('https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/sql/new\n');
      console.error('---SQL START---');
      console.error(RLS_FIX_SQL);
      console.error('---SQL END---\n');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

fixRLS();
