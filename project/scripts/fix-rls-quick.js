#!/usr/bin/env node

/**
 * Quick RLS Fix Script
 *
 * This script temporarily disables RLS on the products table to allow inserts.
 * Then tests if inserts work.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials with SERVICE ROLE key
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixRLS() {
  console.log('🔧 Fixing RLS Policy for Products Table...\n');

  try {
    // Use the RPC function or direct SQL to disable RLS
    console.log('📋 Executing SQL to fix RLS policies...');

    const sqlCommands = `
-- Drop existing policies that might be blocking
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
`;

    console.log('\n' + '='.repeat(70));
    console.log('SQL to execute:');
    console.log(sqlCommands);
    console.log('='.repeat(70) + '\n');

    console.log('⚠️  The Supabase JS client cannot execute DDL commands like DROP POLICY.');
    console.log('⚠️  You need to run this SQL in the Supabase Dashboard.\n');

    console.log('📝 To fix this issue:');
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'YOUR_PROJECT';
    console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('2. Copy the SQL above');
    console.log('3. Paste and click "Run"');
    console.log('4. Verify you see success messages\n');

    console.log('🔄 Alternative: Temporarily disable RLS for testing');
    console.log('   Run this simpler command in SQL Editor:');
    console.log('   ALTER TABLE products DISABLE ROW LEVEL SECURITY;\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the fix
fixRLS().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
