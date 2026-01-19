-- ==============================================================================
-- ÀPÍNLẸ̀RỌ MVP - PRODUCTION DATABASE SETUP
-- ==============================================================================
-- Complete production-ready setup with security, authentication, and data
-- Run this ENTIRE script in your Supabase SQL Editor
-- ==============================================================================

-- ==============================================================================
-- PART 1: AUTHENTICATION & USER MANAGEMENT
-- ==============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create business_users table for owner/staff authentication
CREATE TABLE IF NOT EXISTS business_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  phone_number text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table for customer management
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text,
  phone_number text NOT NULL,
  delivery_address text,
  postal_code text,
  customer_type text DEFAULT 'regular' CHECK (customer_type IN ('regular', 'vip', 'wholesale')),
  total_orders integer DEFAULT 0,
  total_spent numeric(10, 2) DEFAULT 0.00,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for customer lookup
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- ==============================================================================
-- PART 2: ENHANCE EXISTING TABLES WITH SECURITY
-- ==============================================================================

-- Add image_url column to products if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 100;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add tracking columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES business_users(id);

-- Create payments table for transaction tracking
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'online', 'stripe')),
  payment_status text NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  transaction_reference text,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create order_history table for audit trail
CREATE TABLE IF NOT EXISTS order_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  changed_by uuid REFERENCES business_users(id),
  old_status text,
  new_status text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- PART 3: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE business_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON orders;

-- Create secure RLS policies for products (public read, authenticated write)
CREATE POLICY "Public can view active products"
  ON products FOR SELECT
  USING (is_active = true);

CREATE POLICY "Authenticated users can manage products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create secure RLS policies for orders
CREATE POLICY "Authenticated users can view all orders"
  ON orders FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert orders"
  ON orders FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update orders"
  ON orders FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete orders"
  ON orders FOR DELETE
  USING (auth.role() = 'authenticated');

-- RLS policies for customers
CREATE POLICY "Authenticated users can view customers"
  ON customers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage customers"
  ON customers FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for payments
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage payments"
  ON payments FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for business users
CREATE POLICY "Authenticated users can view business users"
  ON business_users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage business users"
  ON business_users FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- RLS policies for order history
CREATE POLICY "Authenticated users can view order history"
  ON order_history FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert order history"
  ON order_history FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ==============================================================================
-- PART 4: DATABASE FUNCTIONS FOR BUSINESS LOGIC
-- ==============================================================================

-- Function to update customer stats when order is created
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_orders = total_orders + 1,
      total_spent = total_spent + NEW.total,
      updated_at = now()
    WHERE id = NEW.customer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer stats
DROP TRIGGER IF EXISTS update_customer_stats_trigger ON orders;
CREATE TRIGGER update_customer_stats_trigger
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_stats();

-- Function to track order status changes
CREATE OR REPLACE FUNCTION track_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_history (order_id, old_status, new_status, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'Status changed via system');
  END IF;

  -- Update delivered_at timestamp
  IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
    NEW.delivered_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order history
DROP TRIGGER IF EXISTS track_order_status_trigger ON orders;
CREATE TRIGGER track_order_status_trigger
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION track_order_status_change();

-- Function to check low stock
CREATE OR REPLACE FUNCTION get_low_stock_products()
RETURNS TABLE (
  product_id uuid,
  product_name text,
  current_stock integer,
  threshold integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, name, stock_quantity, low_stock_threshold
  FROM products
  WHERE stock_quantity <= low_stock_threshold
    AND is_active = true
  ORDER BY stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_order_history_order_id ON order_history(order_id);

-- ==============================================================================
-- PART 6: SEED INITIAL DATA
-- ==============================================================================

-- Insert default business owner (Isha's Treat)
INSERT INTO business_users (email, full_name, role, phone_number)
VALUES
  ('owner@ishastreat.co.uk', 'Isha Patel', 'owner', '+44 7700 900000'),
  ('manager@ishastreat.co.uk', 'Store Manager', 'manager', '+44 7700 900001')
ON CONFLICT (email) DO NOTHING;

-- Update existing products with high-quality images
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400', stock_quantity = 50 WHERE name = 'Jollof Rice Mix';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', stock_quantity = 80 WHERE name = 'Plantain (Green)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', stock_quantity = 30 WHERE name = 'Palm Oil (5L)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596040033229-a0b8d1369a6b?w=400', stock_quantity = 45 WHERE name = 'Egusi Seeds';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400', stock_quantity = 25 WHERE name = 'Stockfish';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583327427275-065a988b9f02?w=400', stock_quantity = 60 WHERE name = 'Scotch Bonnet Peppers';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', stock_quantity = 55 WHERE name = 'Yam Flour';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1599909533013-e37dae0c1d51?w=400', stock_quantity = 70 WHERE name = 'Maggi Seasoning';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400', stock_quantity = 40 WHERE name = 'Cassava Flour';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400', stock_quantity = 20 WHERE name = 'Dried Crayfish';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583327427275-065a988b9f02?w=400', stock_quantity = 35 WHERE name = 'Garden Eggs';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', stock_quantity = 50 WHERE name = 'Fufu Flour';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', stock_quantity = 28 WHERE name = 'Coconut Oil (1L)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', stock_quantity = 22 WHERE name = 'Red Palm Oil';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596040033229-a0b8d1369a6b?w=400', stock_quantity = 38 WHERE name = 'African Nutmeg';

-- Clear existing sample orders
DELETE FROM orders WHERE customer_name IN (
  'Adebayo Johnson', 'Chioma Okafor', 'Kwame Mensah',
  'Fatima Mohammed', 'Emmanuel Osei'
);

-- Insert sample customers
INSERT INTO customers (name, email, phone_number, delivery_address, postal_code, customer_type) VALUES
('Adewale Johnson', 'adewale.j@email.com', '+44 7700 900123', '45 Brixton Hill, London', 'SW2 1AA', 'vip'),
('Chioma Okafor', 'chioma.o@email.com', '+44 7700 900345', '12 Peckham High Street, London', 'SE15 5DT', 'regular'),
('Kwame Mensah', 'kwame.m@email.com', '+44 7700 900456', '78 Hackney Road, London', 'E2 7QL', 'regular'),
('Amara Williams', 'amara.w@email.com', '+44 7700 900567', '34 Tottenham Court Road, London', 'W1T 2RH', 'vip'),
('Fatima Hassan', 'fatima.h@email.com', '+44 7700 900678', '56 Camden High Street, London', 'NW1 0LT', 'regular'),
('Grace Nkrumah', 'grace.n@email.com', '+44 7700 900890', '89 Lewisham High Street, London', 'SE13 6AT', 'regular'),
('Ibrahim Kamara', 'ibrahim.k@email.com', '+44 7700 900901', '23 Brixton Road, London', 'SW9 6DE', 'wholesale'),
('Ngozi Okeke', 'ngozi.o@email.com', '+44 7700 901012', '67 Peckham Rye, London', 'SE15 4ST', 'vip')
ON CONFLICT DO NOTHING;

-- Get customer IDs for orders
DO $$
DECLARE
  customer_adewale uuid;
  customer_chioma uuid;
  customer_kwame uuid;
  customer_amara uuid;
  customer_fatima uuid;
  customer_grace uuid;
  customer_ibrahim uuid;
  customer_ngozi uuid;
BEGIN
  -- Get customer UUIDs
  SELECT id INTO customer_adewale FROM customers WHERE phone_number = '+44 7700 900123';
  SELECT id INTO customer_chioma FROM customers WHERE phone_number = '+44 7700 900345';
  SELECT id INTO customer_kwame FROM customers WHERE phone_number = '+44 7700 900456';
  SELECT id INTO customer_amara FROM customers WHERE phone_number = '+44 7700 900567';
  SELECT id INTO customer_fatima FROM customers WHERE phone_number = '+44 7700 900678';
  SELECT id INTO customer_grace FROM customers WHERE phone_number = '+44 7700 900890';
  SELECT id INTO customer_ibrahim FROM customers WHERE phone_number = '+44 7700 900901';
  SELECT id INTO customer_ngozi FROM customers WHERE phone_number = '+44 7700 901012';

  -- TODAY'S ORDERS (15 orders)
  INSERT INTO orders (customer_id, customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, payment_status, payment_method, notes, created_at) VALUES

  (customer_adewale, 'Adewale Johnson', '+44 7700 900123', '45 Brixton Hill, London SW2 1AA', 'WhatsApp',
   '[{"product_name": "Jollof Rice Mix", "quantity": 3, "price": 8.50}, {"product_name": "Palm Oil (5L)", "quantity": 2, "price": 25.00}]'::jsonb,
   5.00, 80.50, 'Delivered', 'paid', 'cash', 'Delivered at 9am', NOW() - INTERVAL '12 hours'),

  (NULL, 'Blessing Adebayo', '+44 7700 900234', 'Walk-in customer', 'Walk-in',
   '[{"product_name": "Plantain (Green)", "quantity": 5, "price": 3.25}, {"product_name": "Stockfish", "quantity": 1, "price": 18.75}]'::jsonb,
   0.00, 35.00, 'Delivered', 'paid', 'cash', 'Paid cash', NOW() - INTERVAL '11 hours'),

  (customer_chioma, 'Chioma Okafor', '+44 7700 900345', '12 Peckham High Street, London SE15 5DT', 'Web',
   '[{"product_name": "Egusi Seeds", "quantity": 2, "price": 12.50}, {"product_name": "Cassava Flour", "quantity": 3, "price": 5.75}]'::jsonb,
   5.00, 47.25, 'Confirmed', 'paid', 'card', '', NOW() - INTERVAL '10 hours'),

  (customer_kwame, 'Kwame Mensah', '+44 7700 900456', '78 Hackney Road, London E2 7QL', 'Phone',
   '[{"product_name": "Yam Flour", "quantity": 4, "price": 6.99}, {"product_name": "Maggi Seasoning", "quantity": 6, "price": 3.50}]'::jsonb,
   5.00, 53.96, 'Delivered', 'paid', 'bank_transfer', '', NOW() - INTERVAL '9 hours'),

  (customer_amara, 'Amara Williams', '+44 7700 900567', '34 Tottenham Court Road, London W1T 2RH', 'WhatsApp',
   '[{"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}, {"product_name": "Scotch Bonnet Peppers", "quantity": 3, "price": 4.50}]'::jsonb,
   5.00, 43.50, 'Delivered', 'paid', 'cash', '', NOW() - INTERVAL '8 hours'),

  (customer_fatima, 'Fatima Hassan', '+44 7700 900678', '56 Camden High Street, London NW1 0LT', 'Web',
   '[{"product_name": "Dried Crayfish", "quantity": 2, "price": 15.00}, {"product_name": "Garden Eggs", "quantity": 3, "price": 4.25}]'::jsonb,
   5.00, 47.75, 'Confirmed', 'paid', 'online', '', NOW() - INTERVAL '7 hours'),

  (NULL, 'Samuel Osei', '+44 7700 900789', 'Walk-in customer', 'Walk-in',
   '[{"product_name": "Fufu Flour", "quantity": 2, "price": 7.50}, {"product_name": "Coconut Oil (1L)", "quantity": 1, "price": 12.00}]'::jsonb,
   0.00, 27.00, 'Delivered', 'paid', 'cash', '', NOW() - INTERVAL '6 hours'),

  (customer_grace, 'Grace Nkrumah', '+44 7700 900890', '89 Lewisham High Street, London SE13 6AT', 'WhatsApp',
   '[{"product_name": "Jollof Rice Mix", "quantity": 2, "price": 8.50}, {"product_name": "Red Palm Oil", "quantity": 1, "price": 22.50}]'::jsonb,
   5.00, 44.50, 'Pending', 'pending', NULL, '', NOW() - INTERVAL '5 hours'),

  (customer_ibrahim, 'Ibrahim Kamara', '+44 7700 900901', '23 Brixton Road, London SW9 6DE', 'Phone',
   '[{"product_name": "African Nutmeg", "quantity": 3, "price": 8.25}, {"product_name": "Egusi Seeds", "quantity": 1, "price": 12.50}]'::jsonb,
   5.00, 42.25, 'Pending', 'pending', NULL, 'Call before delivery', NOW() - INTERVAL '4 hours'),

  (customer_ngozi, 'Ngozi Okeke', '+44 7700 901012', '67 Peckham Rye, London SE15 4ST', 'Web',
   '[{"product_name": "Stockfish", "quantity": 2, "price": 18.75}, {"product_name": "Plantain (Green)", "quantity": 4, "price": 3.25}]'::jsonb,
   5.00, 55.50, 'Confirmed', 'paid', 'card', '', NOW() - INTERVAL '3 hours'),

  (NULL, 'Kofi Asante', '+44 7700 901123', '45 Streatham High Road, London SW16 1PL', 'WhatsApp',
   '[{"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}, {"product_name": "Cassava Flour", "quantity": 2, "price": 5.75}]'::jsonb,
   5.00, 41.50, 'Delivered', 'paid', 'cash', '', NOW() - INTERVAL '2 hours'),

  (NULL, 'Abena Mensah', '+44 7700 901234', '12 Catford Broadway, London SE6 4SP', 'WhatsApp',
   '[{"product_name": "Yam Flour", "quantity": 3, "price": 6.99}, {"product_name": "Scotch Bonnet Peppers", "quantity": 2, "price": 4.50}]'::jsonb,
   5.00, 35.97, 'Pending', 'pending', NULL, '', NOW() - INTERVAL '1 hour'),

  (NULL, 'Ama Boateng', '+44 7700 901345', '78 Forest Hill Road, London SE23 3HE', 'Web',
   '[{"product_name": "Dried Crayfish", "quantity": 1, "price": 15.00}, {"product_name": "Fufu Flour", "quantity": 1, "price": 7.50}]'::jsonb,
   5.00, 27.50, 'Pending', 'pending', NULL, '', NOW() - INTERVAL '30 minutes'),

  (NULL, 'Yaw Mensah', '+44 7700 901456', '34 Dulwich Village, London SE21 7AL', 'Phone',
   '[{"product_name": "Jollof Rice Mix", "quantity": 4, "price": 8.50}, {"product_name": "Maggi Seasoning", "quantity": 5, "price": 3.50}]'::jsonb,
   5.00, 56.50, 'Pending', 'pending', NULL, '', NOW() - INTERVAL '15 minutes'),

  (NULL, 'Efua Nyarko', '+44 7700 901567', '90 Camberwell Church Street, London SE5 8QZ', 'WhatsApp',
   '[{"product_name": "Palm Oil (5L)", "quantity": 2, "price": 25.00}, {"product_name": "Garden Eggs", "quantity": 2, "price": 4.25}]'::jsonb,
   5.00, 63.50, 'Pending', 'pending', NULL, 'Urgent delivery needed', NOW());

  -- YESTERDAY'S ORDERS (5 orders)
  INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, payment_status, payment_method, notes, created_at) VALUES

  ('Nana Owusu', '+44 7700 901678', '45 Deptford High Street, London SE8 4NS', 'WhatsApp',
   '[{"product_name": "Stockfish", "quantity": 1, "price": 18.75}, {"product_name": "Plantain (Green)", "quantity": 6, "price": 3.25}]'::jsonb,
   5.00, 43.25, 'Delivered', 'paid', 'cash', '', NOW() - INTERVAL '1 day' - INTERVAL '10 hours'),

  ('Kwesi Adjei', '+44 7700 901789', '23 New Cross Road, London SE14 5UE', 'Web',
   '[{"product_name": "Egusi Seeds", "quantity": 3, "price": 12.50}, {"product_name": "Yam Flour", "quantity": 2, "price": 6.99}]'::jsonb,
   5.00, 56.48, 'Delivered', 'paid', 'card', '', NOW() - INTERVAL '1 day' - INTERVAL '8 hours'),

  ('Akosua Darko', '+44 7700 901890', '67 Greenwich Church Street, London SE10 9BL', 'Phone',
   '[{"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}, {"product_name": "Dried Crayfish", "quantity": 1, "price": 15.00}]'::jsonb,
   5.00, 45.00, 'Delivered', 'paid', 'bank_transfer', '', NOW() - INTERVAL '1 day' - INTERVAL '6 hours'),

  ('Kofi Owusu', '+44 7700 901901', 'Walk-in customer', 'Walk-in',
   '[{"product_name": "Cassava Flour", "quantity": 4, "price": 5.75}, {"product_name": "Coconut Oil (1L)", "quantity": 1, "price": 12.00}]'::jsonb,
   0.00, 35.00, 'Delivered', 'paid', 'cash', 'Paid cash', NOW() - INTERVAL '1 day' - INTERVAL '4 hours'),

  ('Esi Mensah', '+44 7700 902012', '12 Woolwich High Street, London SE18 6DL', 'WhatsApp',
   '[{"product_name": "Jollof Rice Mix", "quantity": 2, "price": 8.50}, {"product_name": "Scotch Bonnet Peppers", "quantity": 3, "price": 4.50}]'::jsonb,
   5.00, 35.50, 'Delivered', 'paid', 'cash', '', NOW() - INTERVAL '1 day' - INTERVAL '2 hours');

  -- 2 DAYS AGO (3 orders)
  INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, payment_status, payment_method, notes, created_at) VALUES

  ('Ama Asante', '+44 7700 902123', '45 Elephant and Castle, London SE1 6TB', 'Web',
   '[{"product_name": "Red Palm Oil", "quantity": 1, "price": 22.50}, {"product_name": "African Nutmeg", "quantity": 2, "price": 8.25}]'::jsonb,
   5.00, 44.00, 'Delivered', 'paid', 'online', '', NOW() - INTERVAL '2 days' - INTERVAL '9 hours'),

  ('Kwame Boateng', '+44 7700 902234', '78 Clapham High Street, London SW4 7UL', 'WhatsApp',
   '[{"product_name": "Fufu Flour", "quantity": 3, "price": 7.50}, {"product_name": "Garden Eggs", "quantity": 4, "price": 4.25}]'::jsonb,
   5.00, 44.50, 'Delivered', 'paid', 'cash', '', NOW() - INTERVAL '2 days' - INTERVAL '5 hours'),

  ('Abena Owusu', '+44 7700 902345', '34 Balham High Road, London SW12 9AZ', 'Phone',
   '[{"product_name": "Palm Oil (5L)", "quantity": 2, "price": 25.00}, {"product_name": "Stockfish", "quantity": 1, "price": 18.75}]'::jsonb,
   5.00, 73.75, 'Delivered', 'paid', 'bank_transfer', '', NOW() - INTERVAL '2 days' - INTERVAL '3 hours');
END $$;

-- ==============================================================================
-- PART 7: VERIFICATION & REPORTING VIEWS
-- ==============================================================================

-- Create view for today's sales summary
CREATE OR REPLACE VIEW daily_sales_summary AS
SELECT
  DATE(created_at) as sale_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value,
  SUM(CASE WHEN status = 'Delivered' THEN 1 ELSE 0 END) as delivered_count,
  SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_count,
  SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count
FROM orders
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- Create view for customer insights
CREATE OR REPLACE VIEW customer_insights AS
SELECT
  c.id,
  c.name,
  c.phone_number,
  c.customer_type,
  c.total_orders,
  c.total_spent,
  ROUND(c.total_spent / NULLIF(c.total_orders, 0), 2) as avg_order_value,
  MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name, c.phone_number, c.customer_type, c.total_orders, c.total_spent
ORDER BY c.total_spent DESC;

-- ==============================================================================
-- FINAL VERIFICATION QUERIES
-- ==============================================================================

-- Check today's orders
SELECT
  COUNT(*) as today_orders,
  ROUND(SUM(total)::numeric, 2) as today_revenue,
  ROUND(AVG(total)::numeric, 2) as avg_order_value
FROM orders
WHERE DATE(created_at) = CURRENT_DATE;

-- Check channel distribution
SELECT
  channel,
  COUNT(*) as order_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) as percentage
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY channel
ORDER BY order_count DESC;

-- Check payment status
SELECT
  payment_status,
  COUNT(*) as count,
  ROUND(SUM(total)::numeric, 2) as total_amount
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
GROUP BY payment_status;

-- Verify product images
SELECT
  name,
  stock_quantity,
  CASE
    WHEN image_url != '' THEN '✓ Has Image'
    ELSE '✗ Missing Image'
  END as image_status
FROM products
ORDER BY name;

-- Check low stock
SELECT * FROM get_low_stock_products();

SELECT '✓ PRODUCTION DATABASE SETUP COMPLETE!' as status;
