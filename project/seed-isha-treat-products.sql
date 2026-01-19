-- ==============================================================================
-- ISHA'S TREAT & GROCERIES - PRODUCT CATALOG SEED
-- African & Caribbean Wholesale Grocery Products
-- ==============================================================================

-- First, ensure the products table has all required columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit text DEFAULT 'each';
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url text DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 100;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description text DEFAULT '';

-- Clear existing products (optional - comment out if you want to keep existing)
-- DELETE FROM products;

-- ==============================================================================
-- OILS & COOKING FATS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Palm Oil (Red Oil) 5L', 18.99, 'Oils & Fats', '5L bottle', 50, 'Premium quality Nigerian palm oil, perfect for soups and stews', true),
('Palm Oil (Red Oil) 1L', 5.99, 'Oils & Fats', '1L bottle', 80, 'Pure red palm oil for authentic African cooking', true),
('Groundnut Oil 5L', 15.99, 'Oils & Fats', '5L bottle', 40, 'Pure groundnut oil for frying and cooking', true),
('Coconut Oil 1L', 8.99, 'Oils & Fats', '1L bottle', 60, 'Virgin coconut oil for cooking and baking', true),
('Shea Butter (Ori) 500g', 12.99, 'Oils & Fats', '500g tub', 35, 'Authentic African shea butter for cooking', true);

-- ==============================================================================
-- GRAINS & FLOURS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Nigerian Rice 25kg', 45.00, 'Grains & Rice', '25kg bag', 30, 'Premium long grain Nigerian rice', true),
('Nigerian Rice 10kg', 22.00, 'Grains & Rice', '10kg bag', 50, 'Quality long grain rice', true),
('Basmati Rice 10kg', 28.00, 'Grains & Rice', '10kg bag', 40, 'Aromatic basmati rice', true),
('Yam Flour (Elubo/Amala) 2kg', 8.99, 'Flours', '2kg bag', 60, 'Traditional yam flour for amala', true),
('Cassava Flour (Garri) 5kg', 12.99, 'Flours', '5kg bag', 70, 'White garri for eba and drinking', true),
('Cassava Flour (Garri) 2kg', 5.99, 'Flours', '2kg bag', 80, 'Premium white garri', true),
('Plantain Flour 2kg', 9.99, 'Flours', '2kg bag', 45, 'Pure plantain flour', true),
('Semolina 2kg', 4.99, 'Flours', '2kg bag', 55, 'Golden semolina for swallow', true),
('Pounded Yam Flour 2kg', 7.99, 'Flours', '2kg bag', 65, 'Instant pounded yam flour', true),
('Cornmeal (Ogi/Akamu) 1kg', 3.99, 'Flours', '1kg bag', 50, 'Traditional fermented corn flour', true);

-- ==============================================================================
-- BEANS & LEGUMES
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Honey Beans 5kg', 18.99, 'Beans & Legumes', '5kg bag', 40, 'Premium Nigerian honey beans (oloyin)', true),
('Black-Eyed Beans 5kg', 14.99, 'Beans & Legumes', '5kg bag', 45, 'Quality black-eyed peas for moi moi and akara', true),
('Brown Beans 5kg', 12.99, 'Beans & Legumes', '5kg bag', 50, 'Traditional brown beans', true),
('Lentils 2kg', 6.99, 'Beans & Legumes', '2kg bag', 35, 'Red and green lentils mix', true),
('Chickpeas 2kg', 5.99, 'Beans & Legumes', '2kg bag', 40, 'Dried chickpeas', true);

-- ==============================================================================
-- DRIED FISH & SEAFOOD
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Stockfish (Okporoko) Large', 35.00, 'Dried Fish', 'per piece', 25, 'Premium Norwegian stockfish, large size', true),
('Stockfish (Okporoko) Medium', 25.00, 'Dried Fish', 'per piece', 30, 'Quality stockfish, medium size', true),
('Stockfish Head', 15.00, 'Dried Fish', 'per piece', 35, 'Stockfish head for soups', true),
('Dried Catfish (Eja Kika)', 18.99, 'Dried Fish', '500g pack', 40, 'Smoked dried catfish', true),
('Crayfish (Ground) 500g', 12.99, 'Dried Fish', '500g bag', 60, 'Finely ground crayfish', true),
('Crayfish (Whole) 500g', 14.99, 'Dried Fish', '500g bag', 50, 'Whole dried crayfish', true),
('Dried Prawns 250g', 8.99, 'Dried Fish', '250g pack', 45, 'Premium dried prawns', true),
('Dried Shrimp (Oporo) 500g', 16.99, 'Dried Fish', '500g pack', 35, 'Traditional dried shrimp', true),
('Dried Tilapia (Eja Gbigbe)', 12.99, 'Dried Fish', 'per piece', 40, 'Smoked dried tilapia', true);

-- ==============================================================================
-- MEATS & PROTEINS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Ponmo (Cow Skin) 1kg', 14.99, 'Meats', '1kg pack', 30, 'Clean processed cow skin', true),
('Shaki (Tripe) 1kg', 12.99, 'Meats', '1kg pack', 25, 'Cleaned beef tripe', true),
('Smoked Turkey Wings', 8.99, 'Meats', 'per piece', 40, 'Large smoked turkey wings', true),
('Smoked Turkey Legs', 6.99, 'Meats', 'per piece', 45, 'Smoked turkey drumsticks', true),
('Dried Goat Meat 500g', 22.99, 'Meats', '500g pack', 20, 'Premium dried goat meat', true),
('Suya Spice Mix 200g', 4.99, 'Spices', '200g pack', 70, 'Authentic suya pepper mix', true);

-- ==============================================================================
-- VEGETABLES & LEAVES
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Egusi (Melon Seeds) 1kg', 14.99, 'Seeds & Nuts', '1kg bag', 55, 'Premium ground egusi seeds', true),
('Ogbono (African Mango) 500g', 12.99, 'Seeds & Nuts', '500g bag', 40, 'Ground ogbono for soup', true),
('Bitter Leaf (Dried) 100g', 5.99, 'Dried Vegetables', '100g pack', 50, 'Dried bitter leaf for soup', true),
('Uziza Leaf (Dried) 50g', 4.99, 'Dried Vegetables', '50g pack', 45, 'Aromatic uziza leaves', true),
('Ugu Leaf (Dried) 100g', 5.99, 'Dried Vegetables', '100g pack', 40, 'Dried pumpkin leaves', true),
('Efo Tete (Dried) 100g', 4.99, 'Dried Vegetables', '100g pack', 35, 'Dried spinach leaves', true),
('Locust Beans (Iru/Dawadawa) 200g', 6.99, 'Seasonings', '200g pack', 60, 'Fermented locust beans for seasoning', true),
('Ukpaka (Ugba) 500g', 8.99, 'Seasonings', '500g pack', 30, 'Fermented oil bean seeds', true);

-- ==============================================================================
-- SPICES & SEASONINGS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Cameroon Pepper 200g', 5.99, 'Spices', '200g bag', 65, 'Hot dried Cameroon pepper', true),
('Scotch Bonnet (Ata Rodo) 200g', 3.99, 'Spices', '200g bag', 70, 'Dried scotch bonnet peppers', true),
('Dried Chilli Pepper 500g', 6.99, 'Spices', '500g bag', 50, 'Mixed dried chillies', true),
('Curry Powder 500g', 4.99, 'Spices', '500g tin', 60, 'Nigerian curry powder', true),
('Thyme 100g', 2.99, 'Spices', '100g pack', 80, 'Dried thyme leaves', true),
('Maggi Cubes (Box of 100)', 8.99, 'Seasonings', 'box of 100', 100, 'Maggi seasoning cubes', true),
('Knorr Cubes (Box of 100)', 8.99, 'Seasonings', 'box of 100', 90, 'Knorr seasoning cubes', true),
('Royco Seasoning 100g', 3.99, 'Seasonings', '100g pack', 75, 'All-purpose seasoning', true);

-- ==============================================================================
-- BEVERAGES & DRINKS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Milo 1kg', 12.99, 'Beverages', '1kg tin', 45, 'Nestle Milo chocolate malt drink', true),
('Peak Milk (Tin) 400g', 3.99, 'Beverages', '400g tin', 80, 'Peak evaporated milk', true),
('Peak Milk (Powder) 900g', 14.99, 'Beverages', '900g tin', 50, 'Peak powdered milk', true),
('Bournvita 900g', 11.99, 'Beverages', '900g tin', 40, 'Cadbury Bournvita', true),
('Lipton Tea (100 bags)', 4.99, 'Beverages', 'box of 100', 60, 'Yellow label tea bags', true),
('Ginger (Fresh) 1kg', 4.99, 'Fresh Produce', '1kg', 35, 'Fresh ginger root', true),
('Zobo Leaves 200g', 3.99, 'Beverages', '200g pack', 55, 'Hibiscus leaves for zobo drink', true);

-- ==============================================================================
-- CANNED & PACKAGED GOODS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Tomato Paste (Tin) 400g', 1.99, 'Canned Goods', '400g tin', 120, 'Double concentrate tomato paste', true),
('Tomato Paste (Tin) 800g', 3.49, 'Canned Goods', '800g tin', 80, 'Large tomato paste tin', true),
('Tomato Paste (Sachet) 70g x10', 3.99, 'Canned Goods', 'pack of 10', 90, 'Convenient sachets', true),
('Sardines (Tin)', 1.49, 'Canned Goods', 'per tin', 100, 'Sardines in tomato sauce', true),
('Mackerel (Tin)', 1.99, 'Canned Goods', 'per tin', 90, 'Mackerel in tomato sauce', true),
('Corned Beef 340g', 4.99, 'Canned Goods', '340g tin', 60, 'Premium corned beef', true),
('Baked Beans 400g', 1.29, 'Canned Goods', '400g tin', 80, 'Heinz baked beans', true);

-- ==============================================================================
-- FRESH PRODUCE (Staples)
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Yam (Puna) per tuber', 8.99, 'Fresh Produce', 'per tuber', 25, 'Fresh Ghana yam', true),
('Plantain (Ripe) bunch', 4.99, 'Fresh Produce', 'per bunch', 30, 'Ripe plantain for frying', true),
('Plantain (Green) bunch', 4.99, 'Fresh Produce', 'per bunch', 30, 'Green plantain for cooking', true),
('Cocoyam 1kg', 3.99, 'Fresh Produce', '1kg', 20, 'Fresh cocoyam', true),
('Fresh Pepper Mix 500g', 3.99, 'Fresh Produce', '500g', 35, 'Scotch bonnet and tatase mix', true),
('Onions 5kg', 6.99, 'Fresh Produce', '5kg bag', 40, 'Red onions', true),
('Tomatoes (Box)', 12.99, 'Fresh Produce', 'per box', 25, 'Fresh tomatoes (wholesale)', true);

-- ==============================================================================
-- SNACKS & TREATS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Chin Chin 500g', 4.99, 'Snacks', '500g pack', 50, 'Crunchy chin chin snack', true),
('Plantain Chips 200g', 2.99, 'Snacks', '200g pack', 60, 'Crispy plantain chips', true),
('Puff Puff Mix 500g', 3.99, 'Snacks', '500g pack', 45, 'Ready-made puff puff mix', true),
('Kilishi (Beef Jerky) 100g', 8.99, 'Snacks', '100g pack', 30, 'Nigerian beef jerky', true),
('Kuli Kuli (Groundnut) 200g', 3.99, 'Snacks', '200g pack', 40, 'Traditional groundnut snack', true);

-- ==============================================================================
-- HOUSEHOLD & MISCELLANEOUS
-- ==============================================================================
INSERT INTO products (name, price, category, unit, stock_quantity, description, is_active) VALUES
('Black Soap (Ose Dudu) 500g', 6.99, 'Household', '500g bar', 40, 'Traditional African black soap', true),
('Shea Butter (Body) 500g', 9.99, 'Household', '500g tub', 35, 'Pure unrefined shea butter', true),
('Chewing Sponge (Opon)', 2.99, 'Household', 'pack of 5', 50, 'Natural chewing sponges', true),
('Palm Wine 1L', 8.99, 'Beverages', '1L bottle', 20, 'Fresh palm wine', true);

-- ==============================================================================
-- Update stock levels and verify
-- ==============================================================================
UPDATE products SET is_active = true WHERE is_active IS NULL;
UPDATE products SET stock_quantity = 50 WHERE stock_quantity IS NULL;

-- Show summary
SELECT category, COUNT(*) as product_count,
       ROUND(AVG(price)::numeric, 2) as avg_price
FROM products
WHERE is_active = true
GROUP BY category
ORDER BY category;
