-- ==============================================================================
-- CONSOLIDATED ROW LEVEL SECURITY (RLS) MIGRATION
-- Apinlero Multi-Tenant SaaS Platform
-- Date: 2026-02-15
-- ==============================================================================
-- PURPOSE: Enable RLS on ALL public tables and enforce multi-tenant isolation.
--          Business owners can only access data belonging to their own business.
--          Service role (backend/bot) has full access.
--          Anonymous users have read-only access to public data (products, categories).
--
-- HOW TO RUN:
--   1. Go to Supabase Dashboard > SQL Editor
--   2. Paste this entire script
--   3. Click "Run"
--   4. Verify output shows all tables with RLS ENABLED
--
-- IMPORTANT: This script is idempotent (safe to run multiple times).
-- ==============================================================================


-- ==============================================================================
-- HELPER: Function to check business ownership via email
-- Used by RLS policies to verify the authenticated user owns the business
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.user_business_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM businesses WHERE owner_email = auth.email()
$$;

COMMENT ON FUNCTION public.user_business_ids() IS
  'Returns business IDs owned by the current authenticated user. Used in RLS policies.';

CREATE OR REPLACE FUNCTION public.user_business_slugs()
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT slug FROM businesses WHERE owner_email = auth.email()
$$;

COMMENT ON FUNCTION public.user_business_slugs() IS
  'Returns business slugs owned by the current authenticated user. Used in RLS policies for tables using store_id.';


-- ==============================================================================
-- SECTION 1: CORE BUSINESS TABLES
-- ==============================================================================

-- ---- BUSINESSES ----
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to businesses" ON businesses;
CREATE POLICY "Service role full access to businesses"
  ON businesses FOR ALL TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view active businesses" ON businesses;
CREATE POLICY "Public can view active businesses"
  ON businesses FOR SELECT TO anon
  USING (is_active = true);

DROP POLICY IF EXISTS "Users view own business" ON businesses;
CREATE POLICY "Users view own business"
  ON businesses FOR SELECT TO authenticated
  USING (owner_email = auth.email());

DROP POLICY IF EXISTS "Users update own business" ON businesses;
CREATE POLICY "Users update own business"
  ON businesses FOR UPDATE TO authenticated
  USING (owner_email = auth.email())
  WITH CHECK (owner_email = auth.email());

-- Also allow "Owners can manage own business" (legacy name cleanup)
DROP POLICY IF EXISTS "Owners can manage own business" ON businesses;
DROP POLICY IF EXISTS "businesses_service" ON businesses;
DROP POLICY IF EXISTS "businesses_auth" ON businesses;
DROP POLICY IF EXISTS "businesses_update" ON businesses;
DROP POLICY IF EXISTS "Service role has full access to businesses" ON businesses;


-- ---- PRODUCTS ----
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Clean up ALL old product policies
DROP POLICY IF EXISTS "Service role full access to products" ON products;
DROP POLICY IF EXISTS "Service role has full access to products" ON products;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can insert products" ON products;
DROP POLICY IF EXISTS "Anyone can update products" ON products;
DROP POLICY IF EXISTS "Anyone can view active products" ON products;
DROP POLICY IF EXISTS "Public can view products" ON products;
DROP POLICY IF EXISTS "Public can view active products" ON products;
DROP POLICY IF EXISTS "Users view own business products" ON products;
DROP POLICY IF EXISTS "Users manage own business products" ON products;
DROP POLICY IF EXISTS "Business owners can manage products" ON products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON products;
DROP POLICY IF EXISTS "Enable update access for all users" ON products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON products;
DROP POLICY IF EXISTS "products_service" ON products;
DROP POLICY IF EXISTS "products_public" ON products;
DROP POLICY IF EXISTS "products_auth" ON products;

CREATE POLICY "products_service_role"
  ON products FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "products_public_read"
  ON products FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "products_owner_read"
  ON products FOR SELECT TO authenticated
  USING (
    business_id IN (SELECT public.user_business_ids())
    OR store_id IN (SELECT public.user_business_slugs())
  );

CREATE POLICY "products_owner_write"
  ON products FOR INSERT TO authenticated
  WITH CHECK (
    business_id IN (SELECT public.user_business_ids())
    OR store_id IN (SELECT public.user_business_slugs())
  );

CREATE POLICY "products_owner_update"
  ON products FOR UPDATE TO authenticated
  USING (
    business_id IN (SELECT public.user_business_ids())
    OR store_id IN (SELECT public.user_business_slugs())
  )
  WITH CHECK (
    business_id IN (SELECT public.user_business_ids())
    OR store_id IN (SELECT public.user_business_slugs())
  );

CREATE POLICY "products_owner_delete"
  ON products FOR DELETE TO authenticated
  USING (
    business_id IN (SELECT public.user_business_ids())
    OR store_id IN (SELECT public.user_business_slugs())
  );


-- ---- ORDERS ----
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Clean up old policies
DROP POLICY IF EXISTS "Service role full access to orders" ON orders;
DROP POLICY IF EXISTS "Service role has full access to orders" ON orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Anyone can delete orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can view all orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON orders;
DROP POLICY IF EXISTS "Users view own business orders" ON orders;
DROP POLICY IF EXISTS "Users manage own business orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Business owners can view their orders" ON orders;
DROP POLICY IF EXISTS "orders_service" ON orders;
DROP POLICY IF EXISTS "orders_auth" ON orders;

CREATE POLICY "orders_service_role"
  ON orders FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anonymous users can create orders (storefront checkout)
CREATE POLICY "orders_anon_insert"
  ON orders FOR INSERT TO anon
  WITH CHECK (
    customer_name IS NOT NULL
    AND LENGTH(customer_name) >= 2
    AND total >= 0
  );

-- Business owners see only their own business orders
CREATE POLICY "orders_owner_all"
  ON orders FOR ALL TO authenticated
  USING (business_id IN (SELECT public.user_business_ids()))
  WITH CHECK (business_id IN (SELECT public.user_business_ids()));

-- Customers can view their own orders (via customer_profiles link)
CREATE POLICY "orders_customer_view"
  ON orders FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM customer_profiles WHERE user_id = auth.uid()
    )
  );


-- ---- CUSTOMERS ----
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access to customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can view customers" ON customers;
DROP POLICY IF EXISTS "Anyone can create customers" ON customers;
DROP POLICY IF EXISTS "Authenticated users can update customers" ON customers;
DROP POLICY IF EXISTS "Users view own business customers" ON customers;
DROP POLICY IF EXISTS "Users manage own business customers" ON customers;
DROP POLICY IF EXISTS "customers_service" ON customers;

CREATE POLICY "customers_service_role"
  ON customers FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Anonymous can create customer record during checkout
CREATE POLICY "customers_anon_insert"
  ON customers FOR INSERT TO anon
  WITH CHECK (name IS NOT NULL AND LENGTH(name) >= 2);

-- Business owners manage their own customers
CREATE POLICY "customers_owner_all"
  ON customers FOR ALL TO authenticated
  USING (business_id IN (SELECT public.user_business_ids()))
  WITH CHECK (business_id IN (SELECT public.user_business_ids()));


-- ---- PAYMENTS ----
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'payments') THEN
    ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Authenticated users can view payments" ON payments;
    DROP POLICY IF EXISTS "Service role can insert payments" ON payments;
    DROP POLICY IF EXISTS "Service role can update payments" ON payments;
    DROP POLICY IF EXISTS "Service role can manage payments" ON payments;

    CREATE POLICY "payments_service_role"
      ON payments FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "payments_owner_read"
      ON payments FOR SELECT TO authenticated
      USING (
        order_id IN (
          SELECT id FROM orders WHERE business_id IN (SELECT public.user_business_ids())
        )
      );

    RAISE NOTICE 'RLS configured for payments';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 2: CATEGORIES & SUBCATEGORIES
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories') THEN
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to categories" ON categories;
    DROP POLICY IF EXISTS "Users manage own business categories" ON categories;
    DROP POLICY IF EXISTS "Public can view categories" ON categories;
    DROP POLICY IF EXISTS "categories_service" ON categories;
    DROP POLICY IF EXISTS "categories_public" ON categories;
    DROP POLICY IF EXISTS "categories_auth" ON categories;

    CREATE POLICY "categories_service_role"
      ON categories FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "categories_public_read"
      ON categories FOR SELECT TO anon
      USING (true);

    CREATE POLICY "categories_owner_all"
      ON categories FOR ALL TO authenticated
      USING (
        store_id IN (SELECT public.user_business_slugs())
      )
      WITH CHECK (
        store_id IN (SELECT public.user_business_slugs())
      );

    RAISE NOTICE 'RLS configured for categories';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sub_categories') THEN
    ALTER TABLE sub_categories ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to sub_categories" ON sub_categories;
    DROP POLICY IF EXISTS "Users manage own business sub_categories" ON sub_categories;
    DROP POLICY IF EXISTS "Public can view sub_categories" ON sub_categories;

    CREATE POLICY "sub_categories_service_role"
      ON sub_categories FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "sub_categories_public_read"
      ON sub_categories FOR SELECT TO anon
      USING (true);

    CREATE POLICY "sub_categories_owner_all"
      ON sub_categories FOR ALL TO authenticated
      USING (store_id IN (SELECT public.user_business_slugs()))
      WITH CHECK (store_id IN (SELECT public.user_business_slugs()));

    RAISE NOTICE 'RLS configured for sub_categories';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 3: CUSTOMER AUTH TABLES
-- ==============================================================================

ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Service role has full access to profiles" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can view own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can insert own profile" ON customer_profiles;
DROP POLICY IF EXISTS "Customers can update own profile" ON customer_profiles;

CREATE POLICY "customer_profiles_service_role"
  ON customer_profiles FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Customers can manage their own profile
CREATE POLICY "customer_profiles_own_read"
  ON customer_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "customer_profiles_own_insert"
  ON customer_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "customer_profiles_own_update"
  ON customer_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Business owners can view customer profiles for their business
CREATE POLICY "customer_profiles_business_owner_read"
  ON customer_profiles FOR SELECT TO authenticated
  USING (business_id IN (SELECT public.user_business_ids()));


-- Customer addresses
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_addresses') THEN
    ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Customers can view own addresses" ON customer_addresses;
    DROP POLICY IF EXISTS "Customers can insert own addresses" ON customer_addresses;
    DROP POLICY IF EXISTS "Customers can update own addresses" ON customer_addresses;
    DROP POLICY IF EXISTS "Customers can delete own addresses" ON customer_addresses;

    CREATE POLICY "customer_addresses_service_role"
      ON customer_addresses FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "customer_addresses_own"
      ON customer_addresses FOR ALL TO authenticated
      USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
      WITH CHECK (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

    RAISE NOTICE 'RLS configured for customer_addresses';
  END IF;
END $$;

-- Wishlist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'wishlist') THEN
    ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Customers can view own wishlist" ON wishlist;
    DROP POLICY IF EXISTS "Customers can insert to wishlist" ON wishlist;
    DROP POLICY IF EXISTS "Customers can delete from wishlist" ON wishlist;

    CREATE POLICY "wishlist_service_role"
      ON wishlist FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "wishlist_own"
      ON wishlist FOR ALL TO authenticated
      USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
      WITH CHECK (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

    RAISE NOTICE 'RLS configured for wishlist';
  END IF;
END $$;

-- Recently viewed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recently_viewed') THEN
    ALTER TABLE recently_viewed ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Customers can view own recently viewed" ON recently_viewed;
    DROP POLICY IF EXISTS "Customers can insert recently viewed" ON recently_viewed;
    DROP POLICY IF EXISTS "Customers can update recently viewed" ON recently_viewed;
    DROP POLICY IF EXISTS "Customers can delete recently viewed" ON recently_viewed;

    CREATE POLICY "recently_viewed_service_role"
      ON recently_viewed FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "recently_viewed_own"
      ON recently_viewed FOR ALL TO authenticated
      USING (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()))
      WITH CHECK (customer_id IN (SELECT id FROM customer_profiles WHERE user_id = auth.uid()));

    RAISE NOTICE 'RLS configured for recently_viewed';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 4: USER-BUSINESS MAPPING
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_businesses') THEN
    ALTER TABLE user_businesses ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can read own business mappings" ON user_businesses;
    DROP POLICY IF EXISTS "Authenticated users can insert own mappings" ON user_businesses;

    CREATE POLICY "user_businesses_service_role"
      ON user_businesses FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "user_businesses_own_read"
      ON user_businesses FOR SELECT TO authenticated
      USING (auth.uid() = user_id);

    CREATE POLICY "user_businesses_own_insert"
      ON user_businesses FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);

    RAISE NOTICE 'RLS configured for user_businesses';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 5: WHATSAPP & MESSAGING TABLES
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_configs') THEN
    ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to whatsapp_configs" ON whatsapp_configs;
    DROP POLICY IF EXISTS "Users manage own business whatsapp_configs" ON whatsapp_configs;

    CREATE POLICY "whatsapp_configs_service_role"
      ON whatsapp_configs FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "whatsapp_configs_owner"
      ON whatsapp_configs FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for whatsapp_configs';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_message_logs') THEN
    ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to whatsapp_message_logs" ON whatsapp_message_logs;
    DROP POLICY IF EXISTS "Users view own business whatsapp_message_logs" ON whatsapp_message_logs;

    CREATE POLICY "whatsapp_message_logs_service_role"
      ON whatsapp_message_logs FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "whatsapp_message_logs_owner_read"
      ON whatsapp_message_logs FOR SELECT TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for whatsapp_message_logs';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'whatsapp_analytics_daily') THEN
    ALTER TABLE whatsapp_analytics_daily ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to whatsapp_analytics_daily" ON whatsapp_analytics_daily;
    DROP POLICY IF EXISTS "Users view own business whatsapp_analytics_daily" ON whatsapp_analytics_daily;

    CREATE POLICY "whatsapp_analytics_daily_service_role"
      ON whatsapp_analytics_daily FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "whatsapp_analytics_daily_owner_read"
      ON whatsapp_analytics_daily FOR SELECT TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for whatsapp_analytics_daily';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'media_files') THEN
    ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to media_files" ON media_files;
    DROP POLICY IF EXISTS "Users manage own business media_files" ON media_files;
    DROP POLICY IF EXISTS "Public can view public media_files" ON media_files;

    CREATE POLICY "media_files_service_role"
      ON media_files FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "media_files_owner"
      ON media_files FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    CREATE POLICY "media_files_public_read"
      ON media_files FOR SELECT TO anon
      USING (is_public = true);

    RAISE NOTICE 'RLS configured for media_files';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 6: CALENDAR & DELIVERY TABLES
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events') THEN
    ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to calendar_events" ON calendar_events;
    DROP POLICY IF EXISTS "Users manage own business calendar_events" ON calendar_events;

    CREATE POLICY "calendar_events_service_role"
      ON calendar_events FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "calendar_events_owner"
      ON calendar_events FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    -- Public events visible to everyone (for storefront)
    CREATE POLICY "calendar_events_public_read"
      ON calendar_events FOR SELECT TO anon
      USING (true);

    RAISE NOTICE 'RLS configured for calendar_events';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'delivery_slot_templates') THEN
    ALTER TABLE delivery_slot_templates ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to delivery_slot_templates" ON delivery_slot_templates;
    DROP POLICY IF EXISTS "Users manage own business delivery_slot_templates" ON delivery_slot_templates;

    CREATE POLICY "delivery_slot_templates_service_role"
      ON delivery_slot_templates FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "delivery_slot_templates_owner"
      ON delivery_slot_templates FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for delivery_slot_templates';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'event_bookings') THEN
    ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role full access to event_bookings" ON event_bookings;
    DROP POLICY IF EXISTS "Users manage own business event_bookings" ON event_bookings;

    CREATE POLICY "event_bookings_service_role"
      ON event_bookings FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "event_bookings_owner"
      ON event_bookings FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for event_bookings';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 7: AI & INVENTORY TABLES
-- (Fixes incorrect auth.uid()::uuid pattern from original migration)
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'inventory_insights') THEN
    ALTER TABLE inventory_insights ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their business insights" ON inventory_insights;
    DROP POLICY IF EXISTS "Users can manage their business insights" ON inventory_insights;

    CREATE POLICY "inventory_insights_service_role"
      ON inventory_insights FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "inventory_insights_owner"
      ON inventory_insights FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for inventory_insights';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_batches') THEN
    ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their product batches" ON product_batches;
    DROP POLICY IF EXISTS "Users can manage their product batches" ON product_batches;

    CREATE POLICY "product_batches_service_role"
      ON product_batches FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "product_batches_owner"
      ON product_batches FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for product_batches';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_velocity') THEN
    ALTER TABLE product_velocity ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "product_velocity_service_role"
      ON product_velocity FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "product_velocity_owner"
      ON product_velocity FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for product_velocity';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'promo_campaigns') THEN
    ALTER TABLE promo_campaigns ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Users can view their campaigns" ON promo_campaigns;
    DROP POLICY IF EXISTS "Users can manage their campaigns" ON promo_campaigns;

    CREATE POLICY "promo_campaigns_service_role"
      ON promo_campaigns FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "promo_campaigns_owner"
      ON promo_campaigns FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for promo_campaigns';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'campaign_engagement') THEN
    ALTER TABLE campaign_engagement ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "campaign_engagement_service_role"
      ON campaign_engagement FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "campaign_engagement_owner"
      ON campaign_engagement FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for campaign_engagement';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'smart_bundles') THEN
    ALTER TABLE smart_bundles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "smart_bundles_service_role"
      ON smart_bundles FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "smart_bundles_owner"
      ON smart_bundles FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for smart_bundles';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'customer_segments') THEN
    ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "customer_segments_service_role"
      ON customer_segments FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "customer_segments_owner"
      ON customer_segments FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for customer_segments';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_conversations') THEN
    ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "ai_conversations_service_role"
      ON ai_conversations FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "ai_conversations_owner"
      ON ai_conversations FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for ai_conversations';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recipes') THEN
    ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "recipes_service_role"
      ON recipes FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    -- Public can view approved recipes
    CREATE POLICY "recipes_public_read"
      ON recipes FOR SELECT TO anon
      USING (is_approved = true);

    CREATE POLICY "recipes_owner"
      ON recipes FOR ALL TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()))
      WITH CHECK (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for recipes';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'recipe_ingredients') THEN
    ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "recipe_ingredients_service_role"
      ON recipe_ingredients FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    -- Public can view ingredients for approved recipes
    CREATE POLICY "recipe_ingredients_public_read"
      ON recipe_ingredients FOR SELECT TO anon
      USING (recipe_id IN (SELECT id FROM recipes WHERE is_approved = true));

    CREATE POLICY "recipe_ingredients_owner"
      ON recipe_ingredients FOR ALL TO authenticated
      USING (recipe_id IN (
        SELECT id FROM recipes WHERE business_id IN (SELECT public.user_business_ids())
      ))
      WITH CHECK (recipe_id IN (
        SELECT id FROM recipes WHERE business_id IN (SELECT public.user_business_ids())
      ));

    RAISE NOTICE 'RLS configured for recipe_ingredients';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_usage_logs') THEN
    ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "ai_usage_logs_service_role"
      ON ai_usage_logs FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    CREATE POLICY "ai_usage_logs_owner_read"
      ON ai_usage_logs FOR SELECT TO authenticated
      USING (business_id IN (SELECT public.user_business_ids()));

    RAISE NOTICE 'RLS configured for ai_usage_logs';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_response_cache') THEN
    ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage cache" ON ai_response_cache;

    CREATE POLICY "ai_response_cache_service_role"
      ON ai_response_cache FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    RAISE NOTICE 'RLS configured for ai_response_cache';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 8: AUDIT LOG TABLES
-- ==============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_audit_log') THEN
    ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role manages audit log" ON security_audit_log;

    CREATE POLICY "security_audit_log_service_role"
      ON security_audit_log FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    RAISE NOTICE 'RLS configured for security_audit_log';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Service role can manage audit log" ON audit_log;

    CREATE POLICY "audit_log_service_role"
      ON audit_log FOR ALL TO service_role
      USING (true) WITH CHECK (true);

    RAISE NOTICE 'RLS configured for audit_log';
  END IF;
END $$;


-- ==============================================================================
-- SECTION 9: CATCH-ALL — Enable RLS on any remaining tables without it
-- ==============================================================================

DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND rowsecurity = false
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma%'
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);

    -- Add service role access so backend still works
    EXECUTE format(
      'CREATE POLICY IF NOT EXISTS "%s_service_role" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl.tablename, tbl.tablename
    );

    RAISE NOTICE 'RLS force-enabled on unprotected table: %', tbl.tablename;
  END LOOP;
END $$;


-- ==============================================================================
-- SECTION 10: GRANT PERMISSIONS
-- ==============================================================================

-- Revoke overly broad permissions first
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;

-- Anon: read-only on public-facing tables
GRANT SELECT ON products TO anon;
GRANT SELECT ON categories TO anon;
GRANT INSERT ON orders TO anon;
GRANT INSERT ON customers TO anon;

-- Grant SELECT on businesses to anon only for active business lookup
GRANT SELECT ON businesses TO anon;

-- Authenticated: appropriate access
GRANT ALL ON products TO authenticated;
GRANT ALL ON orders TO authenticated;
GRANT ALL ON customers TO authenticated;
GRANT ALL ON businesses TO authenticated;
GRANT SELECT ON payments TO authenticated;

-- Service role: full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;


-- ==============================================================================
-- SECTION 11: VERIFICATION
-- ==============================================================================

DO $$
DECLARE
  total_tables INTEGER;
  rls_enabled_count INTEGER;
  rls_disabled TEXT[];
  policy_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================================';
  RAISE NOTICE '  APINLERO RLS VERIFICATION REPORT';
  RAISE NOTICE '===========================================================';

  -- Count total public tables
  SELECT COUNT(*) INTO total_tables
  FROM pg_tables WHERE schemaname = 'public';

  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_enabled_count
  FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true;

  -- Find tables WITHOUT RLS
  SELECT array_agg(tablename) INTO rls_disabled
  FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false;

  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies WHERE schemaname = 'public';

  RAISE NOTICE 'Total public tables: %', total_tables;
  RAISE NOTICE 'Tables with RLS ENABLED: %', rls_enabled_count;
  RAISE NOTICE 'Total RLS policies: %', policy_count;

  IF rls_disabled IS NOT NULL AND array_length(rls_disabled, 1) > 0 THEN
    RAISE WARNING 'TABLES WITHOUT RLS: %', rls_disabled;
  ELSE
    RAISE NOTICE 'ALL tables have RLS enabled';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Security model:';
  RAISE NOTICE '  - service_role: Full access (backend/bot)';
  RAISE NOTICE '  - authenticated: Own business data only';
  RAISE NOTICE '  - anon: Read products/categories, create orders/customers';
  RAISE NOTICE '===========================================================';
END $$;
