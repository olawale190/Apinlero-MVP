#!/usr/bin/env node

/**
 * Fix Products RLS Policy Script
 *
 * This script fixes the RLS policy that's blocking product inserts.
 * It executes the SQL commands to recreate permissive policies.
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase credentials
const supabaseUrl = 'https://***REMOVED***.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZm9lemRwYW90d3ZwZmxkeWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzE0ODcsImV4cCI6MjA4MDc0NzQ4N30.mnnK_P0liG-cZrTHP2Q3f2aefNNlIUVUBGvSnPVd81Q';

const supabase = createClient(supabaseUrl, supabaseKey);

const SQL_COMMANDS = [
  // Drop existing policies
  `DROP POLICY IF EXISTS "Anyone can view products" ON products`,
  `DROP POLICY IF EXISTS "Anyone can insert products" ON products`,
  `DROP POLICY IF EXISTS "Anyone can update products" ON products`,
  `DROP POLICY IF EXISTS "Anyone can delete products" ON products`,

  // Create permissive policies
  `CREATE POLICY "Enable read access for all users" ON products FOR SELECT TO public USING (true)`,
  `CREATE POLICY "Enable insert access for all users" ON products FOR INSERT TO public WITH CHECK (true)`,
  `CREATE POLICY "Enable update access for all users" ON products FOR UPDATE TO public USING (true) WITH CHECK (true)`,
  `CREATE POLICY "Enable delete access for all users" ON products FOR DELETE TO public USING (true)`,

  // Ensure RLS is enabled
  `ALTER TABLE products ENABLE ROW LEVEL SECURITY`
];

async function fixRLSPolicy() {
  console.log('🔧 Fixing Products RLS Policy...\n');
  console.log('⚠️  Note: This script needs SERVICE ROLE key to modify policies.');
  console.log('⚠️  Currently using ANON key which cannot modify policies.\n');
  console.log('📋 SQL Commands to run in Supabase SQL Editor:\n');
  console.log('=' .repeat(70));

  const sqlScript = `-- Fix Products RLS Policy
${SQL_COMMANDS.join(';\n\n')};\n`;

  console.log(sqlScript);
  console.log('=' .repeat(70));

  console.log('\n📝 Instructions:');
  console.log('1. Go to: https://supabase.com/dashboard/project/***REMOVED***/sql');
  console.log('2. Copy the SQL above');
  console.log('3. Paste into SQL Editor');
  console.log('4. Click "Run"');
  console.log('5. You should see success messages for each statement\n');

  console.log('✅ After running the SQL, product uploads will work again!');
}

// Run the fix
fixRLSPolicy().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
