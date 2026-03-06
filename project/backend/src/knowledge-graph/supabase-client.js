import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Supabase client with service role key for full access
// Accept both SUPABASE_SERVICE_ROLE_KEY (standard) and SUPABASE_SERVICE_KEY (legacy)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!process.env.SUPABASE_URL || !supabaseKey) {
  console.error('❌ [knowledge-graph] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  supabaseKey
);

// Fetch all products
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
}

// Fetch all orders with items
export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Fetch all customers (if table exists)
export async function getCustomers() {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch {
    console.log('\u2139\uFE0F Customers table not found, extracting from orders');
    return [];
  }
}

// Fetch business users (if table exists)
export async function getBusinessUsers() {
  try {
    const { data, error } = await supabase
      .from('business_users')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch {
    console.log('\u2139\uFE0F Business users table not found');
    return [];
  }
}

// Fetch payments (if table exists)
export async function getPayments() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch {
    console.log('\u2139\uFE0F Payments table not found');
    return [];
  }
}

export default supabase;
