/*
  # Add Missing Order Columns

  1. Changes
    - Add `email` column to orders table (optional customer email)
    - Add `delivery_method` column to orders table (delivery or collection)
    - Add `payment_method` column to orders table (cash or bank_transfer)
  
  2. Details
    - `email` (text) - Customer email address (optional)
    - `delivery_method` (text) - Either 'delivery' or 'collection'
    - `payment_method` (text) - Either 'cash' or 'bank_transfer'
*/

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'email'
  ) THEN
    ALTER TABLE orders ADD COLUMN email text DEFAULT '';
  END IF;
END $$;

-- Add delivery_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'delivery_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN delivery_method text DEFAULT 'delivery' CHECK (delivery_method IN ('delivery', 'collection'));
  END IF;
END $$;

-- Add payment_method column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'payment_method'
  ) THEN
    ALTER TABLE orders ADD COLUMN payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank_transfer'));
  END IF;
END $$;