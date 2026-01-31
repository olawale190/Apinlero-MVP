#!/usr/bin/env node

/**
 * Execute Migrations Using Service Role Key
 * This script uses @supabase/supabase-js with service role key to execute SQL
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Error: Missing required environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeMigrations() {
  console.log('🔧 Executing Supabase Migrations...');
  console.log('=========================================\n');

  try {
    // Step 1: Fix RLS Policy
    console.log('📋 Step 1: Fixing RLS policies...');

    // Drop existing policies
    const dropPolicies = [
      'Anyone can view products',
      'Anyone can insert products',
      'Anyone can update products',
      'Anyone can delete products'
    ];

    // Note: Supabase JS client doesn't support DDL directly
    // We need to use rpc or raw SQL execution
    console.log('⚠️  The Supabase JS client cannot execute DDL commands directly.');
    console.log('⚠️  We need to use the PostgreSQL connection or Management API.\n');

    // Read the migration files
    const rlsMigrationPath = path.join(__dirname, '../supabase/migrations/20260126000001_fix_products_rls_policy.sql');
    const cleanupMigrationPath = path.join(__dirname, '../supabase/migrations/20260126000000_delete_placeholder_products.sql');

    console.log('📄 Migration files:');
    console.log(`   - ${rlsMigrationPath}`);
    console.log(`   - ${cleanupMigrationPath}\n`);

    // Check if files exist
    if (!fs.existsSync(rlsMigrationPath)) {
      throw new Error(`RLS migration file not found: ${rlsMigrationPath}`);
    }
    if (!fs.existsSync(cleanupMigrationPath)) {
      throw new Error(`Cleanup migration file not found: ${cleanupMigrationPath}`);
    }

    const rlsSQL = fs.readFileSync(rlsMigrationPath, 'utf8');
    const cleanupSQL = fs.readFileSync(cleanupMigrationPath, 'utf8');

    console.log('✅ Migration files loaded\n');

    // For cleanup, we can use the Supabase client since it's a DELETE query
    console.log('📋 Step 2: Cleaning up placeholder products...');

    // Execute DELETE using the Supabase client
    const placeholderProducts = [
      { name: 'Jollof Rice Mix', price: 8.50 },
      { name: 'Plantain (Green)', price: 3.25 },
      { name: 'Palm Oil (5L)', price: 25.00 },
      { name: 'Egusi Seeds', price: 12.50 },
      { name: 'Stockfish', price: 18.75 },
      { name: 'Scotch Bonnet Peppers', price: 4.50 },
      { name: 'Yam Flour', price: 6.99 },
      { name: 'Maggi Seasoning', price: 3.50 },
      { name: 'Cassava Flour', price: 5.75 },
      { name: 'Dried Crayfish', price: 15.00 },
      { name: 'Garden Eggs', price: 4.25 },
      { name: 'Fufu Flour', price: 7.50 },
      { name: 'Coconut Oil (1L)', price: 12.00 },
      { name: 'Red Palm Oil', price: 22.50 },
      { name: 'African Nutmeg', price: 8.25 }
    ];

    let deletedCount = 0;
    for (const product of placeholderProducts) {
      const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('name', product.name)
        .eq('price', product.price);

      if (error) {
        console.log(`   ⚠️  Could not delete ${product.name}: ${error.message}`);
      } else {
        deletedCount++;
        console.log(`   ✅ Deleted: ${product.name}`);
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} placeholder products\n`);

    // For RLS policies, we need to inform the user to run them manually
    console.log('=========================================');
    console.log('⚠️  RLS Policy Update Required');
    console.log('=========================================\n');
    console.log('The RLS policies need to be updated via Supabase Dashboard:');
    const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || 'YOUR_PROJECT';
    console.log(`1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`);
    console.log('2. Copy and run this SQL:\n');

    console.log('---SQL START---');
    const rlsPolicySQL = `
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
    console.log(rlsPolicySQL);
    console.log('---SQL END---\n');

    console.log('=========================================');
    console.log('✅ After running the RLS SQL:');
    console.log('   - Product uploads will work immediately');
    console.log('   - Test at: https://app.apinlero.com');
    console.log('=========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

executeMigrations();
