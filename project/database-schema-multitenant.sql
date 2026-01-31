-- Apinlero Multi-Tenant Business Management Platform
-- Complete Database Schema with Multi-Tenant Support
-- Run this SQL in your Supabase SQL Editor to set up the database

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Businesses table - Core multi-tenant table
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  website text,
  logo_url text,

  -- Stripe integration
  stripe_account_id text UNIQUE,
  stripe_customer_id text,
  stripe_onboarding_complete boolean DEFAULT false,
  stripe_charges_enabled boolean DEFAULT false,
  stripe_payouts_enabled boolean DEFAULT false,

  -- Business settings
  currency text DEFAULT 'GBP',
  timezone text DEFAULT 'Europe/London',
  business_type text,

  -- Subscription & billing
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'inactive', 'suspended', 'cancelled')),
  trial_ends_at timestamptz,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  icon text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Sub-categories table
CREATE TABLE IF NOT EXISTS sub_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Products table - Multi-tenant with business_id
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id uuid REFERENCES sub_categories(id) ON DELETE SET NULL,

  name text NOT NULL,
  description text,
  price numeric(10, 2) NOT NULL,
  category text DEFAULT '', -- Legacy field, kept for backward compatibility

  -- Inventory
  sku text,
  stock_quantity integer,
  low_stock_threshold integer,

  -- Media
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,

  -- Product attributes
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  weight_kg numeric(10, 3),
  dimensions_cm jsonb,

  -- Metadata
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Orders table - Multi-tenant with business_id
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,

  customer_name text NOT NULL,
  customer_email text,
  phone_number text DEFAULT '',
  delivery_address text DEFAULT '',

  channel text NOT NULL CHECK (channel IN ('WhatsApp', 'Web', 'Phone', 'Walk-in', 'API')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Pricing
  subtotal numeric(10, 2),
  delivery_fee numeric(10, 2) DEFAULT 5.00,
  tax numeric(10, 2) DEFAULT 0.00,
  discount numeric(10, 2) DEFAULT 0.00,
  total numeric(10, 2) NOT NULL,

  -- Status tracking
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded')),
  payment_status text DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded')),
  payment_method text,

  -- Fulfillment
  tracking_number text,
  estimated_delivery timestamptz,
  delivered_at timestamptz,

  notes text DEFAULT '',
  internal_notes text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Media files table - Track all uploaded files
CREATE TABLE IF NOT EXISTS media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,

  file_path text NOT NULL,
  file_name text NOT NULL,
  bucket_name text NOT NULL,

  file_type text,
  mime_type text,
  file_size_bytes bigint,

  source text NOT NULL CHECK (source IN ('whatsapp', 'web', 'n8n', 'manual')),

  -- Associations
  customer_phone text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,

  -- Access control
  is_public boolean DEFAULT false,
  expires_at timestamptz,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- WhatsApp configurations table
CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,

  phone_number text NOT NULL,
  phone_number_id text NOT NULL,
  business_account_id text NOT NULL,

  webhook_verify_token text,
  access_token text NOT NULL,

  is_active boolean DEFAULT true,
  is_verified boolean DEFAULT false,

  -- Settings
  auto_reply_enabled boolean DEFAULT true,
  business_hours jsonb,
  greeting_message text,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(business_id, phone_number)
);

-- WhatsApp message logs table
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  whatsapp_config_id uuid REFERENCES whatsapp_configs(id) ON DELETE CASCADE,

  message_id text,
  from_phone text NOT NULL,
  to_phone text NOT NULL,

  direction text NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  message_type text NOT NULL,
  message_content text,

  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  error_message text,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- WhatsApp analytics daily table
CREATE TABLE IF NOT EXISTS whatsapp_analytics_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  whatsapp_config_id uuid REFERENCES whatsapp_configs(id) ON DELETE CASCADE,

  date date NOT NULL,

  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  messages_failed integer DEFAULT 0,

  unique_conversations integer DEFAULT 0,
  avg_response_time_seconds numeric(10, 2),

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),

  UNIQUE(business_id, whatsapp_config_id, date)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_businesses_stripe_account ON businesses(stripe_account_id) WHERE stripe_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_business ON categories(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sub_categories_business ON sub_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_sub_categories_category ON sub_categories(category_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sub_category ON products(sub_category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email) WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_business ON media_files(business_id);
CREATE INDEX IF NOT EXISTS idx_media_files_order ON media_files(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_product ON media_files(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_media_files_customer ON media_files(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_business ON whatsapp_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_business ON whatsapp_message_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_logs_from ON whatsapp_message_logs(from_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_business ON whatsapp_analytics_daily(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_analytics_date ON whatsapp_analytics_daily(date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view businesses" ON businesses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert businesses" ON businesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update businesses" ON businesses FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view sub_categories" ON sub_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can manage sub_categories" ON sub_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON products FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete products" ON products FOR DELETE USING (true);
CREATE POLICY "Anyone can view orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Anyone can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update orders" ON orders FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete orders" ON orders FOR DELETE USING (true);
CREATE POLICY "Anyone can view media_files" ON media_files FOR SELECT USING (true);
CREATE POLICY "Anyone can upload media_files" ON media_files FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete media_files" ON media_files FOR DELETE USING (true);
CREATE POLICY "Anyone can view whatsapp_configs" ON whatsapp_configs FOR SELECT USING (true);
CREATE POLICY "Anyone can manage whatsapp_configs" ON whatsapp_configs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can view whatsapp_message_logs" ON whatsapp_message_logs FOR SELECT USING (true);
CREATE POLICY "Anyone can insert whatsapp_message_logs" ON whatsapp_message_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view whatsapp_analytics_daily" ON whatsapp_analytics_daily FOR SELECT USING (true);
CREATE POLICY "Anyone can manage whatsapp_analytics_daily" ON whatsapp_analytics_daily FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sub_categories_updated_at BEFORE UPDATE ON sub_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_configs_updated_at BEFORE UPDATE ON whatsapp_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

INSERT INTO businesses (id, name, email, phone, address, subscription_tier) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Isha''s Treat & Groceries', 'info@ishastreat.com', '+44 20 1234 5678', '123 Market Street, London', 'pro')
ON CONFLICT (id) DO NOTHING;

INSERT INTO categories (business_id, name, description, display_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Rice & Grains', 'Rice, beans, and grain products', 1),
  ('00000000-0000-0000-0000-000000000001', 'Fresh Produce', 'Fresh fruits and vegetables', 2),
  ('00000000-0000-0000-0000-000000000001', 'Oils & Sauces', 'Cooking oils and sauces', 3),
  ('00000000-0000-0000-0000-000000000001', 'Spices & Seeds', 'Spices, herbs, and seeds', 4),
  ('00000000-0000-0000-0000-000000000001', 'Dried Fish', 'Dried and smoked fish', 5),
  ('00000000-0000-0000-0000-000000000001', 'Flours', 'Various types of flour', 6),
  ('00000000-0000-0000-0000-000000000001', 'Seasonings', 'Seasoning cubes and mixes', 7),
  ('00000000-0000-0000-0000-000000000001', 'Seafood', 'Fresh and dried seafood', 8)
ON CONFLICT DO NOTHING;

INSERT INTO products (business_id, name, price, category) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Jollof Rice Mix', 8.50, 'Rice & Grains'),
  ('00000000-0000-0000-0000-000000000001', 'Plantain (Green)', 3.25, 'Fresh Produce'),
  ('00000000-0000-0000-0000-000000000001', 'Palm Oil (5L)', 25.00, 'Oils & Sauces'),
  ('00000000-0000-0000-0000-000000000001', 'Egusi Seeds', 12.50, 'Spices & Seeds'),
  ('00000000-0000-0000-0000-000000000001', 'Stockfish', 18.75, 'Dried Fish'),
  ('00000000-0000-0000-0000-000000000001', 'Scotch Bonnet Peppers', 4.50, 'Fresh Produce'),
  ('00000000-0000-0000-0000-000000000001', 'Yam Flour', 6.99, 'Flours'),
  ('00000000-0000-0000-0000-000000000001', 'Maggi Seasoning', 3.50, 'Seasonings'),
  ('00000000-0000-0000-0000-000000000001', 'Cassava Flour', 5.75, 'Flours'),
  ('00000000-0000-0000-0000-000000000001', 'Dried Crayfish', 15.00, 'Seafood'),
  ('00000000-0000-0000-0000-000000000001', 'Garden Eggs', 4.25, 'Fresh Produce'),
  ('00000000-0000-0000-0000-000000000001', 'Fufu Flour', 7.50, 'Flours'),
  ('00000000-0000-0000-0000-000000000001', 'Coconut Oil (1L)', 12.00, 'Oils & Sauces'),
  ('00000000-0000-0000-0000-000000000001', 'Red Palm Oil', 22.50, 'Oils & Sauces'),
  ('00000000-0000-0000-0000-000000000001', 'African Nutmeg', 8.25, 'Spices & Seeds')
ON CONFLICT DO NOTHING;

INSERT INTO orders (business_id, customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, notes) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Adebayo Johnson', '+44 7700 900123', '45 Brixton Hill, London SW2 1AA', 'WhatsApp',
   '[{"product_name": "Jollof Rice Mix", "quantity": 2, "price": 8.50}, {"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}]'::jsonb, 5.00, 47.00, 'Confirmed', 'Deliver after 2pm'),
  ('00000000-0000-0000-0000-000000000001', 'Chioma Okafor', '+44 7700 900456', '12 Peckham High Street, London SE15 5DT', 'Web',
   '[{"product_name": "Egusi Seeds", "quantity": 3, "price": 12.50}, {"product_name": "Stockfish", "quantity": 1, "price": 18.75}]'::jsonb, 5.00, 61.25, 'Pending', ''),
  ('00000000-0000-0000-0000-000000000001', 'Kwame Mensah', '+44 7700 900789', '78 Hackney Road, London E2 7QL', 'Phone',
   '[{"product_name": "Plantain (Green)", "quantity": 5, "price": 3.25}, {"product_name": "Yam Flour", "quantity": 2, "price": 6.99}]'::jsonb, 5.00, 35.23, 'Delivered', 'Customer requested early delivery'),
  ('00000000-0000-0000-0000-000000000001', 'Fatima Mohammed', '+44 7700 900321', 'Walk-in customer', 'Walk-in',
   '[{"product_name": "Cassava Flour", "quantity": 1, "price": 5.75}, {"product_name": "Dried Crayfish", "quantity": 1, "price": 15.00}]'::jsonb, 0.00, 20.75, 'Delivered', 'Paid in cash'),
  ('00000000-0000-0000-0000-000000000001', 'Emmanuel Osei', '+44 7700 900654', '23 Tottenham High Road, London N15 4RX', 'WhatsApp',
   '[{"product_name": "Garden Eggs", "quantity": 4, "price": 4.25}, {"product_name": "Scotch Bonnet Peppers", "quantity": 2, "price": 4.50}]'::jsonb, 5.00, 31.00, 'Pending', 'Call before delivery')
ON CONFLICT DO NOTHING;
