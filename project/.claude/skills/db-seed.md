# Àpínlẹ̀rọ Database Seed

## Purpose
Seed the Apinlero database with test data for development and testing.

## Usage
```
/db-seed
```

## Prerequisites
- Supabase tables created (run `/db-migrate` first)
- Supabase service role key available

## Commands

| Command | Description |
|---------|-------------|
| `/db-seed` | Seed all tables with test data |
| `/db-seed products` | Seed products only |
| `/db-seed customers` | Seed customers only |
| `/db-seed orders` | Seed orders only |
| `/db-seed business` | Seed test business for multi-tenant |
| `/db-seed clear` | Clear all test data |

## Sample Data

### Products (African & Caribbean Groceries)
```sql
INSERT INTO products (name, description, price, unit, category, stock_quantity, min_stock_level) VALUES
-- Grains & Rice
('Jollof Rice Mix', 'Premium jollof rice seasoning', 8.99, 'pack', 'Grains', 50, 10),
('Nigerian Parboiled Rice (5kg)', 'Long grain parboiled rice', 15.99, 'bag', 'Grains', 30, 5),
('Basmati Rice (5kg)', 'Premium basmati rice', 18.99, 'bag', 'Grains', 25, 5),

-- Oils
('Palm Oil (4L)', 'Red palm oil for cooking', 12.99, 'bottle', 'Oils', 40, 10),
('Groundnut Oil (5L)', 'Pure groundnut oil', 14.99, 'bottle', 'Oils', 35, 8),

-- Proteins
('Stockfish (Okporoko)', 'Dried stockfish', 25.99, 'kg', 'Proteins', 20, 5),
('Dried Prawns', 'Crayfish/dried shrimp', 8.99, '250g', 'Proteins', 45, 10),
('Ponmo (Cow Skin)', 'Prepared cow skin', 6.99, 'pack', 'Proteins', 30, 8),

-- Spices
('Cameroon Pepper', 'Hot ground pepper', 4.99, '100g', 'Spices', 60, 15),
('Locust Beans (Iru)', 'Fermented locust beans', 3.99, 'pack', 'Spices', 40, 10),
('Ogiri', 'Fermented sesame seeds', 2.99, 'pack', 'Spices', 35, 10),

-- Flours
('Garri (White)', 'Premium cassava flakes', 7.99, 'kg', 'Flours', 50, 10),
('Pounded Yam Flour', 'Instant pounded yam', 9.99, 'kg', 'Flours', 40, 10),
('Plantain Flour', 'Amala/plantain flour', 6.99, 'kg', 'Flours', 35, 8),

-- Fresh Produce
('Plantain (Green)', 'Fresh green plantains', 1.99, 'each', 'Fresh', 100, 20),
('Scotch Bonnet Peppers', 'Fresh hot peppers', 2.49, '200g', 'Fresh', 60, 15),
('Yam', 'Fresh African yam', 4.99, 'kg', 'Fresh', 30, 10);
```

### Test Customers
```sql
INSERT INTO customers (name, phone, email, address, postcode) VALUES
('Oluwaseun Adeyemi', '+447123456789', 'seun@example.com', '15 Peckham High Street', 'SE15 5EB'),
('Chidinma Okafor', '+447234567890', 'chi@example.com', '42 Brixton Road', 'SW9 8EQ'),
('Kwame Mensah', '+447345678901', 'kwame@example.com', '78 Lewisham Way', 'SE14 6PP'),
('Amara Johnson', '+447456789012', 'amara@example.com', '23 Deptford High Street', 'SE8 4AF'),
('Emmanuel Osei', '+447567890123', 'emma@example.com', '56 Catford Broadway', 'SE6 4SP');
```

### Test Orders
```sql
INSERT INTO orders (customer_name, phone_number, delivery_address, channel, items, total, status, payment_status) VALUES
(
  'Oluwaseun Adeyemi',
  '+447123456789',
  '15 Peckham High Street, SE15 5EB',
  'WhatsApp',
  '[{"product_name": "Palm Oil (4L)", "quantity": 2, "price": 12.99}, {"product_name": "Garri (White)", "quantity": 3, "price": 7.99}]',
  54.95,
  'Pending',
  'pending'
),
(
  'Chidinma Okafor',
  '+447234567890',
  '42 Brixton Road, SW9 8EQ',
  'Web',
  '[{"product_name": "Jollof Rice Mix", "quantity": 5, "price": 8.99}, {"product_name": "Stockfish (Okporoko)", "quantity": 1, "price": 25.99}]',
  75.94,
  'Confirmed',
  'paid'
),
(
  'Kwame Mensah',
  '+447345678901',
  '78 Lewisham Way, SE14 6PP',
  'Phone',
  '[{"product_name": "Nigerian Parboiled Rice (5kg)", "quantity": 2, "price": 15.99}, {"product_name": "Palm Oil (4L)", "quantity": 1, "price": 12.99}]',
  49.97,
  'Delivered',
  'paid'
);
```

### Test Business (Multi-Tenant)
```sql
INSERT INTO businesses (name, slug, owner_email, phone, address, city, plan) VALUES
('Isha''s Treat & Groceries', 'ishas-treat', 'isha@example.com', '+447448682282', '123 Peckham Rye', 'London', 'starter');

-- Get the business ID
WITH new_business AS (
  SELECT id FROM businesses WHERE slug = 'ishas-treat'
)
INSERT INTO whatsapp_configs (business_id, phone_number_id, webhook_verify_token, provider, display_phone_number, business_name)
SELECT id, 'TEST_PHONE_NUMBER_ID', 'test_verify_token_123', 'meta', '+447448682282', 'Isha''s Treat'
FROM new_business;
```

## Seed Script (Node.js)
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedProducts() {
  const products = [
    { name: 'Palm Oil (4L)', price: 12.99, category: 'Oils', stock_quantity: 40 },
    { name: 'Garri (White)', price: 7.99, category: 'Flours', stock_quantity: 50 },
    // ... more products
  ];

  const { data, error } = await supabase
    .from('products')
    .insert(products);

  if (error) console.error('Error seeding products:', error);
  else console.log('Seeded', data.length, 'products');
}

async function seedAll() {
  await seedProducts();
  await seedCustomers();
  await seedOrders();
  console.log('Seeding complete!');
}

seedAll();
```

## Clear Test Data
```sql
-- Clear in reverse dependency order
DELETE FROM whatsapp_message_logs WHERE business_id IN (SELECT id FROM businesses WHERE slug = 'ishas-treat');
DELETE FROM whatsapp_configs WHERE business_id IN (SELECT id FROM businesses WHERE slug = 'ishas-treat');
DELETE FROM businesses WHERE slug = 'ishas-treat';
DELETE FROM orders WHERE customer_name LIKE 'Test%';
DELETE FROM customers WHERE name LIKE 'Test%';
-- Keep products usually
```

## Verification

### Check Seeded Data
```sql
SELECT 'products' as table_name, COUNT(*) FROM products
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'businesses', COUNT(*) FROM businesses;
```

### Check Products by Category
```sql
SELECT category, COUNT(*), SUM(stock_quantity) as total_stock
FROM products
GROUP BY category
ORDER BY COUNT(*) DESC;
```

## Idempotent Seeding
Use `ON CONFLICT` for re-runnable seeds:
```sql
INSERT INTO products (name, price, category)
VALUES ('Palm Oil (4L)', 12.99, 'Oils')
ON CONFLICT (name) DO UPDATE SET
  price = EXCLUDED.price,
  category = EXCLUDED.category;
```

## Related Skills
- `/db-migrate` - Create tables first
- `/test-bot` - Test with seeded data

---
*Apinlero Database Seed Skill v1.0*
