/*
  # Delete Placeholder Products

  This script removes the sample/placeholder products that were auto-generated
  during initial migrations. It only deletes products that match BOTH the exact
  name AND price from the original seed data, ensuring admin-added products are safe.

  Products to be deleted (from 20251208071120_create_orders_and_products_tables.sql):
  - 15 sample African grocery products with specific names and prices
*/

-- Delete placeholder products by matching exact name AND price
-- This ensures we only delete auto-generated samples, not admin-modified products
DELETE FROM products
WHERE (name = 'Jollof Rice Mix' AND price = 8.50)
   OR (name = 'Plantain (Green)' AND price = 3.25)
   OR (name = 'Palm Oil (5L)' AND price = 25.00)
   OR (name = 'Egusi Seeds' AND price = 12.50)
   OR (name = 'Stockfish' AND price = 18.75)
   OR (name = 'Scotch Bonnet Peppers' AND price = 4.50)
   OR (name = 'Yam Flour' AND price = 6.99)
   OR (name = 'Maggi Seasoning' AND price = 3.50)
   OR (name = 'Cassava Flour' AND price = 5.75)
   OR (name = 'Dried Crayfish' AND price = 15.00)
   OR (name = 'Garden Eggs' AND price = 4.25)
   OR (name = 'Fufu Flour' AND price = 7.50)
   OR (name = 'Coconut Oil (1L)' AND price = 12.00)
   OR (name = 'Red Palm Oil' AND price = 22.50)
   OR (name = 'African Nutmeg' AND price = 8.25);

-- Log the cleanup
DO $$
BEGIN
  RAISE NOTICE 'Placeholder products deleted successfully';
END $$;
