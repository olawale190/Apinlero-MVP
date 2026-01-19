-- Business Management Dashboard Schema for Isha's Treat & Groceries
-- Run this SQL in your Supabase SQL Editor to set up the database

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(10, 2) NOT NULL,
  category text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone_number text DEFAULT '',
  delivery_address text DEFAULT '',
  channel text NOT NULL CHECK (channel IN ('WhatsApp', 'Web', 'Phone', 'Walk-in')),
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  delivery_fee numeric(10, 2) DEFAULT 5.00,
  total numeric(10, 2) NOT NULL,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Delivered')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert products"
  ON products FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update products"
  ON products FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create policies for orders
CREATE POLICY "Anyone can view orders"
  ON orders FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update orders"
  ON orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete orders"
  ON orders FOR DELETE
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

-- Insert sample products
INSERT INTO products (name, price, category) VALUES
  ('Jollof Rice Mix', 8.50, 'Rice & Grains'),
  ('Plantain (Green)', 3.25, 'Fresh Produce'),
  ('Palm Oil (5L)', 25.00, 'Oils & Sauces'),
  ('Egusi Seeds', 12.50, 'Spices & Seeds'),
  ('Stockfish', 18.75, 'Dried Fish'),
  ('Scotch Bonnet Peppers', 4.50, 'Fresh Produce'),
  ('Yam Flour', 6.99, 'Flours'),
  ('Maggi Seasoning', 3.50, 'Seasonings'),
  ('Cassava Flour', 5.75, 'Flours'),
  ('Dried Crayfish', 15.00, 'Seafood'),
  ('Garden Eggs', 4.25, 'Fresh Produce'),
  ('Fufu Flour', 7.50, 'Flours'),
  ('Coconut Oil (1L)', 12.00, 'Oils & Sauces'),
  ('Red Palm Oil', 22.50, 'Oils & Sauces'),
  ('African Nutmeg', 8.25, 'Spices & Seeds')
ON CONFLICT DO NOTHING;

-- Insert sample orders for today
INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, notes) VALUES
  (
    'Adebayo Johnson',
    '+44 7700 900123',
    '45 Brixton Hill, London SW2 1AA',
    'WhatsApp',
    '[{"product_name": "Jollof Rice Mix", "quantity": 2, "price": 8.50}, {"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}]'::jsonb,
    5.00,
    47.00,
    'Confirmed',
    'Deliver after 2pm'
  ),
  (
    'Chioma Okafor',
    '+44 7700 900456',
    '12 Peckham High Street, London SE15 5DT',
    'Web',
    '[{"product_name": "Egusi Seeds", "quantity": 3, "price": 12.50}, {"product_name": "Stockfish", "quantity": 1, "price": 18.75}]'::jsonb,
    5.00,
    61.25,
    'Pending',
    ''
  ),
  (
    'Kwame Mensah',
    '+44 7700 900789',
    '78 Hackney Road, London E2 7QL',
    'Phone',
    '[{"product_name": "Plantain (Green)", "quantity": 5, "price": 3.25}, {"product_name": "Yam Flour", "quantity": 2, "price": 6.99}]'::jsonb,
    5.00,
    35.23,
    'Delivered',
    'Customer requested early delivery'
  ),
  (
    'Fatima Mohammed',
    '+44 7700 900321',
    'Walk-in customer',
    'Walk-in',
    '[{"product_name": "Cassava Flour", "quantity": 1, "price": 5.75}, {"product_name": "Dried Crayfish", "quantity": 1, "price": 15.00}]'::jsonb,
    0.00,
    20.75,
    'Delivered',
    'Paid in cash'
  ),
  (
    'Emmanuel Osei',
    '+44 7700 900654',
    '23 Tottenham High Road, London N15 4RX',
    'WhatsApp',
    '[{"product_name": "Garden Eggs", "quantity": 4, "price": 4.25}, {"product_name": "Scotch Bonnet Peppers", "quantity": 2, "price": 4.50}]'::jsonb,
    5.00,
    31.00,
    'Pending',
    'Call before delivery'
  )
ON CONFLICT DO NOTHING;
