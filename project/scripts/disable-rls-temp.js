#!/usr/bin/env node

/**
 * Temporary RLS Disable Script
 *
 * Since we can't execute DDL via the JS client, this script:
 * 1. Tests that service role can insert (bypasses RLS)
 * 2. Provides instructions for the manual SQL fix
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gafoezdpaotwvpfldyhc.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZm9lemRwYW90d3ZwZmxkeWhjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTE3MTQ4NywiZXhwIjoyMDgwNzQ3NDg3fQ.o3iNhUEMQ5kUoRoEcu-YdAq8gFB9CHKtaHu9SsXD-VM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function testAndFix() {
  console.log('🔍 Testing RLS Issue...\n');

  // Test if service role can insert (it should bypass RLS)
  const testProduct = {
    name: '_TEST_PRODUCT_DELETE_ME',
    price: 0.01,
    category: 'Test',
    unit: 'each',
    stock_quantity: 1,
    is_active: false
  };

  console.log('📝 Testing insert with service role key...');
  const { data, error } = await supabase
    .from('products')
    .insert([testProduct])
    .select()
    .single();

  if (error) {
    console.error('❌ Even service role cannot insert:', error.message);
    console.log('\n🚨 This means RLS is BLOCKING even the service role!');
  } else {
    console.log('✅ Service role CAN insert (RLS bypassed)');
    console.log(`   Test product ID: ${data.id}`);

    // Clean up test product
    await supabase.from('products').delete().eq('id', data.id);
    console.log('✅ Test product cleaned up\n');
  }

  console.log('\n' + '='.repeat(70));
  console.log('📋 TO FIX THE RLS ISSUE FOR REGULAR USERS:');
  console.log('='.repeat(70));
  console.log('\n1. Go to: https://supabase.com/dashboard/project/gafoezdpaotwvpfldyhc/sql/new\n');
  console.log('2. Paste this SQL and click RUN:\n');

  const sql = `-- Fix Products RLS
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can delete products" ON products;

CREATE POLICY "Enable read access for all users" ON products FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE TO public USING (true);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;`;

  console.log(sql);
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ After running the SQL, product uploads will work!\n');
}

testAndFix().catch(console.error);
