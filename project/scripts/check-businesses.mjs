import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from project root
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinesses() {
  console.log('🔍 Checking businesses table...\n');

  const { data, error } = await supabase
    .from('businesses')
    .select('*')
    .eq('is_active', true);

  if (error) {
    console.error('❌ Error fetching businesses:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No active businesses found in database');
    return;
  }

  console.log(`✅ Found ${data.length} active business(es):\n`);
  data.forEach((business, index) => {
    console.log(`${index + 1}. ${business.name}`);
    console.log(`   ID: ${business.id}`);
    console.log(`   Slug: ${business.slug}`);
    console.log(`   Owner: ${business.owner_email}`);
    console.log(`   Phone: ${business.phone || 'N/A'}`);
    console.log('');
  });

  // Suggest default business for localhost
  console.log(`💡 Default business for localhost: ${data[0].slug} (${data[0].id})`);
}

checkBusinesses();
