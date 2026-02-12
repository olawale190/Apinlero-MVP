#!/usr/bin/env node
/**
 * Bulk import products from CSV into Supabase
 * Usage: node scripts/import-products.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://gafoezdpaotwvpfldyhc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdhZm9lemRwYW90d3ZwZmxkeWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzE0ODcsImV4cCI6MjA4MDc0NzQ4N30.mnnK_P0liG-cZrTHP2Q3f2aefNNlIUVUBGvSnPVd81Q';
const BUSINESS_ID = 'bf642ec5-8990-4581-bc1c-e4171d472007';

async function supabaseRequest(endpoint, method, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    method,
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  if (!res.ok) {
    return { error: text, data: null };
  }
  try {
    return { data: JSON.parse(text), error: null };
  } catch {
    return { data: text, error: null };
  }
}

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());

  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    if (values.every(v => !v)) continue;

    const name = values[0] || '';
    const price = parseFloat((values[1] || '0').replace(/[£$,]/g, ''));
    const category = values[2] || 'General';
    const unit = values[3] || 'each';
    const stock = parseInt(values[4] || '0') || 0;

    if (!name || name.length < 2) continue;
    if (isNaN(price) || price <= 0) continue;

    products.push({
      name,
      price: Math.round(price * 100), // Convert to pence
      category,
      unit,
      stock_quantity: stock,
      is_active: true
    });
  }

  return products;
}

async function main() {
  console.log('📦 Isha\'s Treat Product Import');
  console.log('================================\n');

  // Read CSV
  const csvPath = resolve(__dirname, '../public/imports/ishas_treat_full_inventory.csv');
  const csvContent = readFileSync(csvPath, 'utf-8');
  const products = parseCSV(csvContent);

  console.log(`Found ${products.length} valid products to import\n`);

  // Show category breakdown
  const categories = {};
  products.forEach(p => {
    categories[p.category] = (categories[p.category] || 0) + 1;
  });
  console.log('Category breakdown:');
  Object.entries(categories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count} products`);
  });
  console.log('');

  // Insert in batches of 20
  const batchSize = 20;
  let successCount = 0;
  let failCount = 0;
  let retryWithoutBizId = false;

  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(products.length / batchSize);

    // Add business_id unless we know the column doesn't exist
    const productsToInsert = batch.map(p => {
      const row = { ...p };
      if (!retryWithoutBizId) {
        row.business_id = BUSINESS_ID;
      }
      return row;
    });

    let { data, error } = await supabaseRequest('products', 'POST', productsToInsert);

    // Retry without business_id if column doesn't exist
    if (error && error.includes('business_id')) {
      console.log('  ⚠️  business_id column not found, retrying without it...');
      retryWithoutBizId = true;
      const withoutBizId = batch.map(p => ({ ...p }));
      ({ data, error } = await supabaseRequest('products', 'POST', withoutBizId));
    }

    if (error) {
      console.log(`  ❌ Batch ${batchNum}/${totalBatches} FAILED: ${error}`);
      failCount += batch.length;
    } else {
      const inserted = Array.isArray(data) ? data.length : batch.length;
      successCount += inserted;
      console.log(`  ✅ Batch ${batchNum}/${totalBatches}: ${inserted} products inserted`);
    }
  }

  console.log('\n================================');
  console.log(`✅ Successfully imported: ${successCount} products`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} products`);
  }
  console.log('\nDone! Refresh your dashboard at app.apinlero.com to see the products.');
}

main().catch(console.error);
