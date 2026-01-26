-- ==============================================================================
-- Apinlero Demo Data Seed Script
-- ==============================================================================
-- Run this in Supabase SQL Editor to populate demo data
-- This creates realistic sample data for visa demonstration
-- ==============================================================================

-- Clear existing demo data (optional - uncomment if needed)
-- DELETE FROM orders WHERE customer_name LIKE 'Demo%';
-- DELETE FROM customers WHERE name LIKE 'Demo%';

-- ==============================================================================
-- PRODUCTS - African & Caribbean Grocery Items
-- ==============================================================================

INSERT INTO products (name, price, category, stock_quantity, description, unit, sku, is_active, low_stock_threshold, bulk_price_10, bulk_price_50)
VALUES
  -- Palm Oil & Cooking Oils
  ('Palm Oil 5L', 18.99, 'Oils', 45, 'Premium quality red palm oil from Nigeria', 'bottle', 'OIL-PALM-5L', true, 10, 17.50, 16.00),
  ('Palm Oil 1L', 5.99, 'Oils', 120, 'Red palm oil - perfect for soups and stews', 'bottle', 'OIL-PALM-1L', true, 20, 5.50, 5.00),
  ('Groundnut Oil 5L', 22.99, 'Oils', 35, 'Pure groundnut oil for frying', 'bottle', 'OIL-GNUT-5L', true, 8, 21.00, 19.50),
  ('Coconut Oil 1L', 8.99, 'Oils', 60, 'Virgin coconut oil', 'bottle', 'OIL-COCO-1L', true, 15, 8.00, 7.50),

  -- Rice & Grains
  ('Nigerian Rice 25kg', 42.99, 'Rice & Grains', 28, 'Premium ofada rice from Nigeria', 'bag', 'RICE-NIG-25', true, 5, 40.00, 38.00),
  ('Basmati Rice 10kg', 24.99, 'Rice & Grains', 55, 'Long grain basmati rice', 'bag', 'RICE-BAS-10', true, 10, 23.00, 21.50),
  ('Parboiled Rice 5kg', 12.99, 'Rice & Grains', 80, 'Easy cook parboiled rice', 'bag', 'RICE-PAR-5', true, 15, 12.00, 11.00),
  ('Garri (White) 4kg', 8.99, 'Rice & Grains', 95, 'Nigerian cassava flakes - white', 'bag', 'GARRI-WHT-4', true, 20, 8.00, 7.50),
  ('Garri (Yellow) 4kg', 9.49, 'Rice & Grains', 85, 'Nigerian cassava flakes - yellow', 'bag', 'GARRI-YEL-4', true, 20, 8.50, 8.00),

  -- Flour & Swallow
  ('Semovita 2kg', 7.99, 'Flour & Swallow', 70, 'Semolina flour for swallow', 'pack', 'FLR-SEMO-2', true, 15, 7.50, 7.00),
  ('Pounded Yam Flour 4kg', 14.99, 'Flour & Swallow', 45, 'Instant pounded yam flour', 'bag', 'FLR-PYAM-4', true, 10, 14.00, 13.00),
  ('Fufu Flour 2kg', 6.99, 'Flour & Swallow', 60, 'Traditional fufu flour', 'pack', 'FLR-FUFU-2', true, 12, 6.50, 6.00),
  ('Amala Flour 2kg', 7.49, 'Flour & Swallow', 50, 'Yam flour for amala', 'pack', 'FLR-AMAL-2', true, 10, 7.00, 6.50),

  -- Canned & Packaged Foods
  ('Tomato Paste 2.2kg', 6.99, 'Canned Foods', 100, 'Triple concentrate tomato paste', 'tin', 'CAN-TOM-2K', true, 25, 6.50, 6.00),
  ('Sardines in Oil (50 pack)', 45.00, 'Canned Foods', 30, 'Sardines in vegetable oil - bulk', 'case', 'CAN-SAR-50', true, 5, 42.00, 40.00),
  ('Mackerel in Tomato Sauce', 2.49, 'Canned Foods', 150, 'Mackerel fillets in tomato sauce', 'tin', 'CAN-MAC-TS', true, 30, 2.30, 2.10),
  ('Corned Beef 340g', 4.99, 'Canned Foods', 80, 'Premium corned beef', 'tin', 'CAN-BEEF-340', true, 15, 4.70, 4.50),

  -- Spices & Seasonings
  ('Crayfish (Ground) 500g', 12.99, 'Spices', 65, 'Dried ground crayfish', 'pack', 'SPI-CRAY-500', true, 15, 12.00, 11.00),
  ('Ogiri (Locust Beans)', 3.99, 'Spices', 40, 'Fermented locust beans seasoning', 'pack', 'SPI-OGIR-100', true, 10, 3.70, 3.50),
  ('Dawadawa 200g', 4.49, 'Spices', 55, 'Fermented seasoning', 'pack', 'SPI-DAWA-200', true, 10, 4.20, 4.00),
  ('Suya Spice 250g', 5.99, 'Spices', 75, 'Traditional suya spice blend', 'pack', 'SPI-SUYA-250', true, 15, 5.50, 5.00),
  ('Curry Powder 500g', 4.99, 'Spices', 90, 'Nigerian curry powder', 'pack', 'SPI-CURR-500', true, 20, 4.70, 4.50),
  ('Thyme 100g', 2.99, 'Spices', 100, 'Dried thyme leaves', 'pack', 'SPI-THYM-100', true, 25, 2.80, 2.60),

  -- Dried Fish & Meat
  ('Stockfish (Okporoko) 1kg', 32.99, 'Dried Fish', 25, 'Premium Norwegian stockfish', 'pack', 'FISH-STOK-1K', true, 5, 31.00, 29.00),
  ('Dried Catfish 500g', 18.99, 'Dried Fish', 35, 'Smoked dried catfish', 'pack', 'FISH-CAT-500', true, 8, 17.50, 16.50),
  ('Ponmo (Cow Skin) 1kg', 14.99, 'Dried Meat', 40, 'Dried cow skin', 'pack', 'MEAT-PONM-1K', true, 10, 14.00, 13.00),
  ('Kpomo (Goat Skin) 500g', 9.99, 'Dried Meat', 30, 'Dried goat skin', 'pack', 'MEAT-KPOM-500', true, 8, 9.50, 9.00),

  -- Snacks & Drinks
  ('Malt Drink (24 pack)', 28.99, 'Drinks', 45, 'Malt drink - case of 24', 'case', 'DRK-MALT-24', true, 10, 27.00, 25.50),
  ('Ginger Beer (12 pack)', 14.99, 'Drinks', 55, 'Old Jamaica ginger beer', 'case', 'DRK-GING-12', true, 12, 14.00, 13.00),
  ('Supermalt (6 pack)', 7.99, 'Drinks', 80, 'Supermalt energy drink', 'pack', 'DRK-SMAL-6', true, 15, 7.50, 7.00),
  ('Chin Chin 500g', 6.99, 'Snacks', 70, 'Crunchy chin chin snack', 'pack', 'SNK-CHIN-500', true, 15, 6.50, 6.00),
  ('Plantain Chips 200g', 3.99, 'Snacks', 100, 'Crispy plantain chips', 'pack', 'SNK-PLAN-200', true, 25, 3.70, 3.50),

  -- Fresh Produce (Limited stock items)
  ('Scotch Bonnet Peppers 500g', 4.99, 'Fresh Produce', 30, 'Fresh scotch bonnet peppers', 'pack', 'FRESH-SCOT-500', true, 10, 4.70, 4.50),
  ('Fresh Okra 500g', 3.49, 'Fresh Produce', 25, 'Fresh okra (lady fingers)', 'pack', 'FRESH-OKRA-500', true, 8, 3.30, 3.10),
  ('Bitter Leaf (Fresh)', 2.99, 'Fresh Produce', 20, 'Fresh bitter leaf for soup', 'bunch', 'FRESH-BITL', true, 5, 2.80, 2.60),
  ('Ugu Leaf (Fresh)', 3.49, 'Fresh Produce', 25, 'Fresh pumpkin leaves', 'bunch', 'FRESH-UGU', true, 8, 3.30, 3.10),

  -- Beans & Legumes
  ('Black Eyed Beans 5kg', 16.99, 'Beans', 40, 'Nigerian black eyed beans', 'bag', 'BEAN-BEYE-5', true, 10, 16.00, 15.00),
  ('Honey Beans 2kg', 8.99, 'Beans', 50, 'Premium honey beans', 'bag', 'BEAN-HONY-2', true, 12, 8.50, 8.00),
  ('Brown Beans 5kg', 14.99, 'Beans', 45, 'Nigerian brown beans', 'bag', 'BEAN-BRWN-5', true, 10, 14.00, 13.00),

  -- Yam & Tubers
  ('Yam (1 tuber)', 8.99, 'Tubers', 35, 'Fresh Nigerian yam', 'piece', 'TUB-YAM-1', true, 8, 8.50, 8.00),
  ('Cocoyam 1kg', 4.99, 'Tubers', 30, 'Fresh cocoyam', 'kg', 'TUB-COCO-1', true, 8, 4.70, 4.50),

  -- Seasonings & Stock
  ('Maggi Cubes (100 pack)', 12.99, 'Seasonings', 60, 'Maggi seasoning cubes', 'pack', 'SEA-MAGG-100', true, 15, 12.00, 11.00),
  ('Knorr Cubes (100 pack)', 12.99, 'Seasonings', 55, 'Knorr chicken cubes', 'pack', 'SEA-KNOR-100', true, 15, 12.00, 11.00),
  ('Onga Seasoning 1kg', 8.99, 'Seasonings', 40, 'Onga all purpose seasoning', 'pack', 'SEA-ONGA-1K', true, 10, 8.50, 8.00)
ON CONFLICT (sku) DO UPDATE SET
  price = EXCLUDED.price,
  stock_quantity = EXCLUDED.stock_quantity,
  is_active = EXCLUDED.is_active;

-- ==============================================================================
-- CUSTOMERS - Sample Customer Base
-- ==============================================================================

INSERT INTO customers (name, phone_number, email, address, postcode, notes, total_orders, total_spent, last_order_date)
VALUES
  ('Adaeze Okonkwo', '+447451234567', 'adaeze.okonkwo@email.com', '45 Brixton Road', 'SW9 6DE', 'Regular customer - prefers delivery on Saturdays', 12, 456.50, NOW() - INTERVAL '2 days'),
  ('Chidi Nwankwo', '+447452345678', 'chidi.nwankwo@email.com', '23 Peckham High Street', 'SE15 5EB', 'Wholesale buyer - restaurant owner', 28, 2340.00, NOW() - INTERVAL '1 day'),
  ('Funke Adeyemi', '+447453456789', 'funke.a@email.com', '78 Lewisham Way', 'SE14 6PP', 'Catering business - large orders', 15, 1890.00, NOW() - INTERVAL '5 days'),
  ('Ola Bakare', '+447454567890', 'ola.bakare@gmail.com', '12 Deptford Broadway', 'SE8 4PA', 'Weekly regular - Friday collection', 8, 234.00, NOW() - INTERVAL '7 days'),
  ('Yinka Oladipo', '+447455678901', 'yinka.o@hotmail.com', '56 Catford Broadway', 'SE6 4SP', 'Party orders - advance notice needed', 5, 567.00, NOW() - INTERVAL '14 days'),
  ('Bola Akinwale', '+447456789012', 'bola.akin@email.com', '34 Woolwich Road', 'SE10 0JU', 'Prefers cash on delivery', 9, 312.00, NOW() - INTERVAL '3 days'),
  ('Kunle Ogundimu', '+447457890123', 'kunle.og@email.com', '89 New Cross Road', 'SE14 5DJ', 'Restaurant supply - monthly account', 22, 3450.00, NOW() - INTERVAL '4 days'),
  ('Ngozi Eze', '+447458901234', 'ngozi.eze@email.com', '67 Camberwell Road', 'SE5 0EZ', 'Referred by Adaeze', 3, 145.00, NOW() - INTERVAL '10 days'),
  ('Tunde Fashola', '+447459012345', 'tunde.f@email.com', '23 Old Kent Road', 'SE1 5TY', 'Event caterer - bulk orders', 7, 890.00, NOW() - INTERVAL '6 days'),
  ('Sade Williams', '+447450123456', 'sade.w@email.com', '45 Elephant Road', 'SE17 1LB', 'Weekly shop - Thursdays', 11, 423.00, NOW() - INTERVAL '8 days'),
  ('Emeka Okoro', '+447461234567', 'emeka.ok@email.com', '12 Walworth Road', 'SE17 1JE', 'Small restaurant owner', 18, 1567.00, NOW() - INTERVAL '2 days'),
  ('Amaka Chukwu', '+447462345678', 'amaka.c@email.com', '78 Denmark Hill', 'SE5 8RZ', 'Home cook - social media presence', 6, 234.00, NOW() - INTERVAL '9 days'),
  ('Dayo Adeleke', '+447463456789', 'dayo.a@email.com', '34 Lordship Lane', 'SE22 8HN', 'Monthly bulk buyer', 4, 678.00, NOW() - INTERVAL '21 days'),
  ('Kemi Olatunji', '+447464567890', 'kemi.ol@email.com', '56 Rye Lane', 'SE15 5BY', 'New customer - referred', 2, 89.00, NOW() - INTERVAL '5 days'),
  ('Gbenga Adebayo', '+447465678901', 'gbenga.ad@email.com', '90 Streatham High Road', 'SW16 1BS', 'Takeaway owner - weekly orders', 14, 1234.00, NOW() - INTERVAL '1 day')
ON CONFLICT (phone_number) DO UPDATE SET
  total_orders = customers.total_orders + 1,
  last_order_date = NOW();

-- ==============================================================================
-- ORDERS - Sample Orders Across Different Channels
-- ==============================================================================

-- Helper function to generate random order items JSON
-- (In actual use, this would reference real product IDs)

-- Recent WhatsApp Orders
INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, notes, created_at)
VALUES
  ('Adaeze Okonkwo', '+447451234567', '45 Brixton Road, SW9 6DE', 'WhatsApp',
   '[{"product_name": "Palm Oil 5L", "quantity": 2, "price": 18.99}, {"product_name": "Garri (White) 4kg", "quantity": 3, "price": 8.99}, {"product_name": "Stockfish 1kg", "quantity": 1, "price": 32.99}]'::jsonb,
   5.00, 102.92, 'Delivered', 'Left with neighbour', NOW() - INTERVAL '2 days'),

  ('Chidi Nwankwo', '+447452345678', '23 Peckham High Street, SE15 5EB', 'WhatsApp',
   '[{"product_name": "Nigerian Rice 25kg", "quantity": 5, "price": 42.99}, {"product_name": "Palm Oil 5L", "quantity": 10, "price": 18.99}, {"product_name": "Tomato Paste 2.2kg", "quantity": 20, "price": 6.99}]'::jsonb,
   0.00, 544.65, 'Delivered', 'Wholesale order - restaurant', NOW() - INTERVAL '1 day'),

  ('Funke Adeyemi', '+447453456789', '78 Lewisham Way, SE14 6PP', 'WhatsApp',
   '[{"product_name": "Pounded Yam Flour 4kg", "quantity": 8, "price": 14.99}, {"product_name": "Egusi (Ground) 500g", "quantity": 5, "price": 8.99}, {"product_name": "Crayfish 500g", "quantity": 4, "price": 12.99}]'::jsonb,
   5.00, 221.83, 'Confirmed', 'Catering order - party on Saturday', NOW() - INTERVAL '4 hours'),

  ('Bola Akinwale', '+447456789012', '34 Woolwich Road, SE10 0JU', 'WhatsApp',
   '[{"product_name": "Garri (Yellow) 4kg", "quantity": 2, "price": 9.49}, {"product_name": "Palm Oil 1L", "quantity": 3, "price": 5.99}]'::jsonb,
   5.00, 41.95, 'Pending', 'Cash on delivery', NOW() - INTERVAL '1 hour'),

-- Web Orders
  ('Ngozi Eze', '+447458901234', '67 Camberwell Road, SE5 0EZ', 'Web',
   '[{"product_name": "Malt Drink 24 pack", "quantity": 2, "price": 28.99}, {"product_name": "Chin Chin 500g", "quantity": 4, "price": 6.99}]'::jsonb,
   5.00, 90.94, 'Delivered', 'Online payment received', NOW() - INTERVAL '3 days'),

  ('Sade Williams', '+447450123456', '45 Elephant Road, SE17 1LB', 'Web',
   '[{"product_name": "Suya Spice 250g", "quantity": 3, "price": 5.99}, {"product_name": "Plantain Chips 200g", "quantity": 5, "price": 3.99}]'::jsonb,
   5.00, 42.92, 'Confirmed', 'Card payment', NOW() - INTERVAL '6 hours'),

  ('Kemi Olatunji', '+447464567890', '56 Rye Lane, SE15 5BY', 'Web',
   '[{"product_name": "Black Eyed Beans 5kg", "quantity": 1, "price": 16.99}, {"product_name": "Honey Beans 2kg", "quantity": 2, "price": 8.99}]'::jsonb,
   5.00, 39.97, 'Pending', 'New customer - first order', NOW() - INTERVAL '30 minutes'),

-- Phone Orders
  ('Kunle Ogundimu', '+447457890123', '89 New Cross Road, SE14 5DJ', 'Phone',
   '[{"product_name": "Sardines 50 pack", "quantity": 3, "price": 45.00}, {"product_name": "Mackerel in Tomato", "quantity": 48, "price": 2.49}, {"product_name": "Corned Beef 340g", "quantity": 24, "price": 4.99}]'::jsonb,
   0.00, 374.28, 'Delivered', 'Monthly restaurant supply', NOW() - INTERVAL '4 days'),

  ('Tunde Fashola', '+447459012345', '23 Old Kent Road, SE1 5TY', 'Phone',
   '[{"product_name": "Nigerian Rice 25kg", "quantity": 3, "price": 42.99}, {"product_name": "Palm Oil 5L", "quantity": 6, "price": 18.99}]'::jsonb,
   5.00, 247.91, 'Confirmed', 'Event next weekend', NOW() - INTERVAL '2 hours'),

  ('Gbenga Adebayo', '+447465678901', '90 Streatham High Road, SW16 1BS', 'Phone',
   '[{"product_name": "Tomato Paste 2.2kg", "quantity": 12, "price": 6.99}, {"product_name": "Maggi Cubes 100 pack", "quantity": 3, "price": 12.99}, {"product_name": "Curry Powder 500g", "quantity": 4, "price": 4.99}]'::jsonb,
   5.00, 147.81, 'Delivered', 'Takeaway weekly order', NOW() - INTERVAL '1 day'),

-- Walk-in Orders
  ('Ola Bakare', '+447454567890', 'Collection', 'Walk-in',
   '[{"product_name": "Fufu Flour 2kg", "quantity": 2, "price": 6.99}, {"product_name": "Ogiri 100g", "quantity": 3, "price": 3.99}]'::jsonb,
   0.00, 25.95, 'Delivered', 'Friday collection - paid cash', NOW() - INTERVAL '7 days'),

  ('Yinka Oladipo', '+447455678901', 'Collection', 'Walk-in',
   '[{"product_name": "Yam 1 tuber", "quantity": 5, "price": 8.99}, {"product_name": "Scotch Bonnet 500g", "quantity": 3, "price": 4.99}]'::jsonb,
   0.00, 59.92, 'Delivered', 'Party prep - paid card', NOW() - INTERVAL '14 days'),

  ('Emeka Okoro', '+447461234567', 'Collection', 'Walk-in',
   '[{"product_name": "Basmati Rice 10kg", "quantity": 2, "price": 24.99}, {"product_name": "Groundnut Oil 5L", "quantity": 1, "price": 22.99}]'::jsonb,
   0.00, 72.97, 'Delivered', 'Restaurant pickup', NOW() - INTERVAL '2 days'),

  ('Amaka Chukwu', '+447462345678', '78 Denmark Hill, SE5 8RZ', 'Walk-in',
   '[{"product_name": "Fresh Okra 500g", "quantity": 2, "price": 3.49}, {"product_name": "Ugu Leaf Fresh", "quantity": 3, "price": 3.49}]'::jsonb,
   5.00, 22.45, 'Pending', 'Delivery requested - home cook', NOW() - INTERVAL '3 hours'),

  ('Dayo Adeleke', '+447463456789', '34 Lordship Lane, SE22 8HN', 'WhatsApp',
   '[{"product_name": "Semovita 2kg", "quantity": 4, "price": 7.99}, {"product_name": "Amala Flour 2kg", "quantity": 3, "price": 7.49}]'::jsonb,
   5.00, 59.43, 'Confirmed', 'Monthly order', NOW() - INTERVAL '5 hours');

-- More historical orders for analytics
INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, notes, created_at)
SELECT
  c.name,
  c.phone_number,
  c.address || ', ' || c.postcode,
  (ARRAY['WhatsApp', 'Web', 'Phone', 'Walk-in'])[floor(random() * 4 + 1)],
  json_build_array(
    json_build_object('product_name', 'Palm Oil 5L', 'quantity', floor(random() * 3 + 1)::int, 'price', 18.99),
    json_build_object('product_name', 'Garri 4kg', 'quantity', floor(random() * 2 + 1)::int, 'price', 8.99)
  )::jsonb,
  CASE WHEN random() > 0.3 THEN 5.00 ELSE 0.00 END,
  round((random() * 150 + 30)::numeric, 2),
  (ARRAY['Delivered', 'Delivered', 'Delivered', 'Confirmed', 'Pending'])[floor(random() * 5 + 1)],
  'Historical order',
  NOW() - (random() * 90)::int * INTERVAL '1 day'
FROM customers c
CROSS JOIN generate_series(1, 3);

-- ==============================================================================
-- UPDATE STATISTICS
-- ==============================================================================

-- Update customer order counts based on actual orders
UPDATE customers SET
  total_orders = (SELECT COUNT(*) FROM orders WHERE orders.phone_number = customers.phone_number),
  total_spent = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE orders.phone_number = customers.phone_number AND orders.status = 'Delivered'),
  last_order_date = (SELECT MAX(created_at) FROM orders WHERE orders.phone_number = customers.phone_number);

-- ==============================================================================
-- VERIFICATION
-- ==============================================================================

-- Run these to verify data was inserted:
-- SELECT COUNT(*) as product_count FROM products;
-- SELECT COUNT(*) as customer_count FROM customers;
-- SELECT COUNT(*) as order_count FROM orders;
-- SELECT channel, COUNT(*) FROM orders GROUP BY channel;
-- SELECT status, COUNT(*) FROM orders GROUP BY status;
-- SELECT SUM(total) as total_revenue FROM orders WHERE status = 'Delivered';

DO $$
DECLARE
  product_count INT;
  customer_count INT;
  order_count INT;
  total_revenue NUMERIC;
BEGIN
  SELECT COUNT(*) INTO product_count FROM products;
  SELECT COUNT(*) INTO customer_count FROM customers;
  SELECT COUNT(*) INTO order_count FROM orders;
  SELECT COALESCE(SUM(total), 0) INTO total_revenue FROM orders WHERE status = 'Delivered';

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Demo Data Seed Complete';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Products: %', product_count;
  RAISE NOTICE 'Customers: %', customer_count;
  RAISE NOTICE 'Orders: %', order_count;
  RAISE NOTICE 'Total Revenue (Delivered): £%', total_revenue;
  RAISE NOTICE '========================================';
END $$;
