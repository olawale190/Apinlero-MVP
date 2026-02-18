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

export type { Product, OrderItem, Order } from '../types';
