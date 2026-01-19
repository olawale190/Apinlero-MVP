-- ==============================================================================
-- SIMPLE UPGRADE - Just add images and new orders
-- ==============================================================================

-- Step 1: Add image column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';

-- Step 2: Update products with images
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?w=400' WHERE name = 'Jollof Rice Mix';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400' WHERE name = 'Plantain (Green)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' WHERE name = 'Palm Oil (5L)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596040033229-a0b8d1369a6b?w=400' WHERE name = 'Egusi Seeds';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400' WHERE name = 'Stockfish';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583327427275-065a988b9f02?w=400' WHERE name = 'Scotch Bonnet Peppers';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' WHERE name = 'Yam Flour';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1599909533013-e37dae0c1d51?w=400' WHERE name = 'Maggi Seasoning';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=400' WHERE name = 'Cassava Flour';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=400' WHERE name = 'Dried Crayfish';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1583327427275-065a988b9f02?w=400' WHERE name = 'Garden Eggs';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400' WHERE name = 'Fufu Flour';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' WHERE name = 'Coconut Oil (1L)';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400' WHERE name = 'Red Palm Oil';
UPDATE products SET image_url = 'https://images.unsplash.com/photo-1596040033229-a0b8d1369a6b?w=400' WHERE name = 'African Nutmeg';

-- Step 3: Clear old sample data
DELETE FROM orders WHERE customer_name IN (
  'Adebayo Johnson', 'Chioma Okafor', 'Kwame Mensah',
  'Fatima Mohammed', 'Emmanuel Osei'
);

-- Step 4: Add 15 TODAY's orders
INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, delivery_fee, total, status, notes, created_at) VALUES

('Adewale Johnson', '+44 7700 900123', '45 Brixton Hill, London SW2 1AA', 'WhatsApp',
 '[{"product_name": "Jollof Rice Mix", "quantity": 3, "price": 8.50}, {"product_name": "Palm Oil (5L)", "quantity": 2, "price": 25.00}]'::jsonb,
 5.00, 80.50, 'Delivered', 'Delivered at 9am', NOW() - INTERVAL '12 hours'),

('Blessing Adebayo', '+44 7700 900234', 'Walk-in customer', 'Walk-in',
 '[{"product_name": "Plantain (Green)", "quantity": 5, "price": 3.25}, {"product_name": "Stockfish", "quantity": 1, "price": 18.75}]'::jsonb,
 0.00, 35.00, 'Delivered', 'Paid cash', NOW() - INTERVAL '11 hours'),

('Chioma Okafor', '+44 7700 900345', '12 Peckham High Street, London SE15 5DT', 'Web',
 '[{"product_name": "Egusi Seeds", "quantity": 2, "price": 12.50}, {"product_name": "Cassava Flour", "quantity": 3, "price": 5.75}]'::jsonb,
 5.00, 47.25, 'Confirmed', '', NOW() - INTERVAL '10 hours'),

('Kwame Mensah', '+44 7700 900456', '78 Hackney Road, London E2 7QL', 'Phone',
 '[{"product_name": "Yam Flour", "quantity": 4, "price": 6.99}, {"product_name": "Maggi Seasoning", "quantity": 6, "price": 3.50}]'::jsonb,
 5.00, 53.96, 'Delivered', '', NOW() - INTERVAL '9 hours'),

('Amara Williams', '+44 7700 900567', '34 Tottenham Court Road, London W1T 2RH', 'WhatsApp',
 '[{"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}, {"product_name": "Scotch Bonnet Peppers", "quantity": 3, "price": 4.50}]'::jsonb,
 5.00, 43.50, 'Delivered', '', NOW() - INTERVAL '8 hours'),

('Fatima Hassan', '+44 7700 900678', '56 Camden High Street, London NW1 0LT', 'Web',
 '[{"product_name": "Dried Crayfish", "quantity": 2, "price": 15.00}, {"product_name": "Garden Eggs", "quantity": 3, "price": 4.25}]'::jsonb,
 5.00, 47.75, 'Confirmed', '', NOW() - INTERVAL '7 hours'),

('Samuel Osei', '+44 7700 900789', 'Walk-in customer', 'Walk-in',
 '[{"product_name": "Fufu Flour", "quantity": 2, "price": 7.50}, {"product_name": "Coconut Oil (1L)", "quantity": 1, "price": 12.00}]'::jsonb,
 0.00, 27.00, 'Delivered', '', NOW() - INTERVAL '6 hours'),

('Grace Nkrumah', '+44 7700 900890', '89 Lewisham High Street, London SE13 6AT', 'WhatsApp',
 '[{"product_name": "Jollof Rice Mix", "quantity": 2, "price": 8.50}, {"product_name": "Red Palm Oil", "quantity": 1, "price": 22.50}]'::jsonb,
 5.00, 44.50, 'Pending', '', NOW() - INTERVAL '5 hours'),

('Ibrahim Kamara', '+44 7700 900901', '23 Brixton Road, London SW9 6DE', 'Phone',
 '[{"product_name": "African Nutmeg", "quantity": 3, "price": 8.25}, {"product_name": "Egusi Seeds", "quantity": 1, "price": 12.50}]'::jsonb,
 5.00, 42.25, 'Pending', 'Call before delivery', NOW() - INTERVAL '4 hours'),

('Ngozi Okeke', '+44 7700 901012', '67 Peckham Rye, London SE15 4ST', 'Web',
 '[{"product_name": "Stockfish", "quantity": 2, "price": 18.75}, {"product_name": "Plantain (Green)", "quantity": 4, "price": 3.25}]'::jsonb,
 5.00, 55.50, 'Confirmed', '', NOW() - INTERVAL '3 hours'),

('Kofi Asante', '+44 7700 901123', '45 Streatham High Road, London SW16 1PL', 'WhatsApp',
 '[{"product_name": "Palm Oil (5L)", "quantity": 1, "price": 25.00}, {"product_name": "Cassava Flour", "quantity": 2, "price": 5.75}]'::jsonb,
 5.00, 41.50, 'Delivered', '', NOW() - INTERVAL '2 hours'),

('Abena Mensah', '+44 7700 901234', '12 Catford Broadway, London SE6 4SP', 'WhatsApp',
 '[{"product_name": "Yam Flour", "quantity": 3, "price": 6.99}, {"product_name": "Scotch Bonnet Peppers", "quantity": 2, "price": 4.50}]'::jsonb,
 5.00, 35.97, 'Pending', '', NOW() - INTERVAL '1 hour'),

('Ama Boateng', '+44 7700 901345', '78 Forest Hill Road, London SE23 3HE', 'Web',
 '[{"product_name": "Dried Crayfish", "quantity": 1, "price": 15.00}, {"product_name": "Fufu Flour", "quantity": 1, "price": 7.50}]'::jsonb,
 5.00, 27.50, 'Pending', '', NOW() - INTERVAL '30 minutes'),

('Yaw Mensah', '+44 7700 901456', '34 Dulwich Village, London SE21 7AL', 'Phone',
 '[{"product_name": "Jollof Rice Mix", "quantity": 4, "price": 8.50}, {"product_name": "Maggi Seasoning", "quantity": 5, "price": 3.50}]'::jsonb,
 5.00, 56.50, 'Pending', '', NOW() - INTERVAL '15 minutes'),

('Efua Nyarko', '+44 7700 901567', '90 Camberwell Church Street, London SE5 8QZ', 'WhatsApp',
 '[{"product_name": "Palm Oil (5L)", "quantity": 2, "price": 25.00}, {"product_name": "Garden Eggs", "quantity": 2, "price": 4.25}]'::jsonb,
 5.00, 63.50, 'Pending', 'Urgent delivery needed', NOW());

-- Verification
SELECT '✓ UPGRADE COMPLETE!' as status;
SELECT COUNT(*) as today_orders FROM orders WHERE DATE(created_at) = CURRENT_DATE;
SELECT COUNT(*) as products_with_images FROM products WHERE image_url != '';
