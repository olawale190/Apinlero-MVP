-- Quick Seed: Create Isha's Treat Business and Sample Products
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Create or update the business
INSERT INTO businesses (name, slug, owner_email, phone, is_active, created_at)
VALUES (
  'Isha''s Treat & Groceries',
  'ishas-treat',
  'owner@ishastreat.com',
  '+447448682282',
  true,
  now()
)
ON CONFLICT (slug)
DO UPDATE SET
  is_active = true,
  name = 'Isha''s Treat & Groceries',
  phone = '+447448682282';

-- Step 2: Get the business ID for inserting products
DO $$
DECLARE
  business_uuid UUID;
BEGIN
  -- Get business ID
  SELECT id INTO business_uuid
  FROM businesses
  WHERE slug = 'ishas-treat';

  -- Delete existing products for this business (optional - for clean slate)
  -- DELETE FROM products WHERE business_id = business_uuid;

  -- Insert sample products (prices in pence: 300 = £3.00)
  INSERT INTO products (business_id, name, price, category, unit, stock_quantity, description, is_active)
  VALUES
    (business_uuid, 'Yam', 300, 'Vegetables', 'per piece', 50, 'Fresh yam', true),
    (business_uuid, 'Plantain', 500, 'Vegetables', 'per bunch', 40, 'Fresh plantain bunch', true),
    (business_uuid, 'Palm Oil 1L', 599, 'Oils & Fats', '1L bottle', 80, 'Pure red palm oil', true),
    (business_uuid, 'Cassava Flour (Garri) 2kg', 599, 'Flours', '2kg bag', 80, 'Premium white garri', true),
    (business_uuid, 'Stockfish (Okporoko) Medium', 2500, 'Dried Fish', 'per piece', 30, 'Quality stockfish', true),
    (business_uuid, 'Nigerian Rice 10kg', 2200, 'Grains & Rice', '10kg bag', 50, 'Quality long grain rice', true),
    (business_uuid, 'Smoked Turkey Wings', 899, 'Meats', 'per piece', 40, 'Large smoked turkey wings', true),
    (business_uuid, 'Crayfish (Ground) 500g', 1299, 'Dried Fish', '500g bag', 60, 'Finely ground crayfish', true)
  ON CONFLICT DO NOTHING;

  -- Print success message
  RAISE NOTICE 'Business and products created successfully!';
END $$;

-- Verify the data
SELECT
  b.name as business_name,
  COUNT(p.id) as product_count
FROM businesses b
LEFT JOIN products p ON p.business_id = b.id
WHERE b.slug = 'ishas-treat'
GROUP BY b.id, b.name;
