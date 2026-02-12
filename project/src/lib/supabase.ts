import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 *
 * SECURITY NOTES:
 * - Environment variables MUST be set in .env file
 * - Never commit actual keys to source control
 * - The anon key is safe to expose (designed for client-side use)
 * - RLS (Row Level Security) policies protect the database
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables in all environments
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CRITICAL: Missing Supabase configuration. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env. ' +
    'The app will not function correctly without these variables.'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  sub_category?: string;
  unit: string;
  image_url?: string;
  is_active: boolean;
  stock_quantity?: number;
  created_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email?: string;
  phone_number: string;
  delivery_address: string;
  channel: 'WhatsApp' | 'Web' | 'Phone' | 'Walk-in';
  items: OrderItem[];
  delivery_fee: number;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Delivered';
  notes: string;
  created_at: string;
  updated_at: string;
}
