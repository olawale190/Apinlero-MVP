-- ============================================================
-- TARGETED FIX: Only what's missing after partial migration
-- Run in Supabase SQL Editor
-- Date: 2026-02-11
-- ============================================================


-- ============================================================
-- FIX 1: Add missing columns to businesses
-- ============================================================

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'solo';

RAISE NOTICE '[1/6] businesses columns fixed';


-- ============================================================
-- FIX 2: Add missing columns to user_businesses
-- ============================================================

ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS invited_by uuid;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS invited_at timestamptz;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS joined_at timestamptz DEFAULT now();
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE user_businesses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_user_businesses_business_id ON user_businesses(business_id);
CREATE INDEX IF NOT EXISTS idx_user_businesses_active ON user_businesses(is_active) WHERE is_active = true;

DO $$ BEGIN RAISE NOTICE '[2/6] user_businesses columns fixed'; END $$;


-- ============================================================
-- FIX 3: Business lookup helper functions
-- ============================================================

CREATE OR REPLACE FUNCTION get_user_business_id(user_uuid uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE business_uuid uuid;
BEGIN
  SELECT ub.business_id INTO business_uuid
  FROM user_businesses ub INNER JOIN businesses b ON ub.business_id = b.id
  WHERE ub.user_id = user_uuid AND ub.is_active = true AND b.is_active = true
  ORDER BY ub.joined_at DESC LIMIT 1;
  IF business_uuid IS NULL THEN
    SELECT b.id INTO business_uuid FROM businesses b INNER JOIN auth.users u ON u.email = b.owner_email
    WHERE u.id = user_uuid AND b.is_active = true LIMIT 1;
  END IF;
  RETURN business_uuid;
END; $$;

CREATE OR REPLACE FUNCTION get_user_business_ids(user_uuid uuid)
RETURNS uuid[] LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE business_uuids uuid[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT ub.business_id) INTO business_uuids
  FROM user_businesses ub INNER JOIN businesses b ON ub.business_id = b.id
  WHERE ub.user_id = user_uuid AND ub.is_active = true AND b.is_active = true;
  IF business_uuids IS NULL OR array_length(business_uuids, 1) IS NULL THEN
    SELECT ARRAY_AGG(DISTINCT b.id) INTO business_uuids FROM businesses b INNER JOIN auth.users u ON u.email = b.owner_email
    WHERE u.id = user_uuid AND b.is_active = true;
  END IF;
  RETURN COALESCE(business_uuids, ARRAY[]::uuid[]);
END; $$;

DO $$ BEGIN RAISE NOTICE '[3/6] Helper functions created'; END $$;


-- ============================================================
-- FIX 4: Create missing AI/inventory tables
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('reorder_suggestion', 'expiry_warning', 'stock_optimization', 'bundle_recommendation', 'seasonal_prediction', 'waste_alert', 'velocity_analysis', 'demand_forecast')),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE, product_ids uuid[],
  title text NOT NULL, description text NOT NULL, ai_reasoning text,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence_score numeric(3, 2), recommended_action jsonb, expected_impact jsonb,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  actioned_at timestamptz, outcome_notes text, metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(), expires_at timestamptz
);

CREATE TABLE IF NOT EXISTS product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  batch_number text NOT NULL, quantity integer NOT NULL CHECK (quantity >= 0),
  cost_per_unit numeric(10, 2) CHECK (cost_per_unit >= 0),
  received_date date NOT NULL, expiry_date date,
  days_until_expiry integer GENERATED ALWAYS AS (
    CASE WHEN expiry_date IS NOT NULL THEN EXTRACT(day FROM (expiry_date - CURRENT_DATE))::integer ELSE NULL END
  ) STORED,
  location text, supplier_name text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'sold', 'discarded')),
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_velocity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL, period_end date NOT NULL,
  units_sold integer DEFAULT 0, revenue numeric(10, 2) DEFAULT 0, avg_daily_sales numeric(10, 2),
  trend text CHECK (trend IN ('increasing', 'stable', 'decreasing')), trend_percentage numeric(5, 2),
  seasonal_factor numeric(3, 2), cultural_events text[], created_at timestamptz DEFAULT now(),
  UNIQUE(business_id, product_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text,
  campaign_type text NOT NULL CHECK (campaign_type IN ('flash_sale', 'bundle_offer', 'seasonal', 'win_back', 'loyalty_reward', 'new_product', 'cultural_event', 'custom')),
  ai_generated boolean DEFAULT false, ai_reasoning text, product_ids uuid[], bundle_config jsonb,
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
  discount_value numeric(10, 2),
  target_segment text CHECK (target_segment IN ('all', 'new_customers', 'returning', 'inactive', 'vip', 'custom')),
  target_criteria jsonb, estimated_reach integer, message_template text NOT NULL, visual_card_url text,
  start_date timestamptz NOT NULL, end_date timestamptz NOT NULL, send_time time,
  channels text[] DEFAULT ARRAY['whatsapp', 'email'],
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  sent_count integer DEFAULT 0, opened_count integer DEFAULT 0, clicked_count integer DEFAULT 0,
  converted_count integer DEFAULT 0, revenue_generated numeric(10, 2) DEFAULT 0,
  is_ab_test boolean DEFAULT false, ab_variant text, ab_test_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campaign_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES promo_campaigns(id) ON DELETE CASCADE NOT NULL,
  customer_phone text NOT NULL, customer_email text, customer_id uuid,
  sent_at timestamptz, opened_at timestamptz, clicked_at timestamptz, converted_at timestamptz,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL, order_value numeric(10, 2),
  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email')),
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS smart_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text, items jsonb NOT NULL,
  total_value numeric(10, 2) NOT NULL, bundle_price numeric(10, 2) NOT NULL,
  savings numeric(10, 2) GENERATED ALWAYS AS (total_value - bundle_price) STORED,
  savings_percentage numeric(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_value > 0 THEN ((total_value - bundle_price) / total_value * 100)::numeric(5, 2) ELSE 0 END
  ) STORED,
  ai_generated boolean DEFAULT false, generation_reason text, confidence_score numeric(3, 2),
  cultural_event_id uuid REFERENCES calendar_events(id) ON DELETE SET NULL,
  recipe_suggestion text, times_suggested integer DEFAULT 0, times_purchased integer DEFAULT 0,
  conversion_rate numeric(5, 2), is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL, description text,
  segment_type text CHECK (segment_type IN ('behavioral', 'demographic', 'rfm', 'ai_discovered', 'custom')),
  criteria jsonb NOT NULL, ai_generated boolean DEFAULT false, ai_reasoning text,
  customer_count integer DEFAULT 0, avg_order_value numeric(10, 2), total_revenue numeric(10, 2),
  recommended_actions jsonb, is_active boolean DEFAULT true, last_updated timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  conversation_type text CHECK (conversation_type IN ('inventory_management', 'promotion_creation', 'analytics_query', 'general')),
  messages jsonb NOT NULL DEFAULT '[]'::jsonb, user_id uuid, session_id text,
  channel text DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'api')),
  actions_taken jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,
  name text NOT NULL, description text, cuisine text,
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prep_time_minutes integer, serves integer, instructions text[], image_url text, cultural_context text,
  submitted_by_customer_id uuid, is_approved boolean DEFAULT false, is_featured boolean DEFAULT false,
  views integer DEFAULT 0, times_cooked integer DEFAULT 0,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity text, is_optional boolean DEFAULT false,
  PRIMARY KEY (recipe_id, product_id)
);

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), business_id uuid, endpoint text,
  tokens_used integer, cost numeric(10, 4), response_time_ms integer,
  success boolean, error_message text, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_response_cache (
  cache_key text PRIMARY KEY, response jsonb NOT NULL, created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stripe_key_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accessed_by TEXT,
  action TEXT NOT NULL CHECK (action IN ('encrypt', 'decrypt', 'view'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inventory_insights_business ON inventory_insights(business_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_business ON product_batches(business_id);
CREATE INDEX IF NOT EXISTS idx_product_batches_product ON product_batches(product_id);
CREATE INDEX IF NOT EXISTS idx_product_velocity_business ON product_velocity(business_id);
CREATE INDEX IF NOT EXISTS idx_promo_campaigns_business ON promo_campaigns(business_id);
CREATE INDEX IF NOT EXISTS idx_campaign_engagement_campaign ON campaign_engagement(campaign_id);
CREATE INDEX IF NOT EXISTS idx_smart_bundles_business ON smart_bundles(business_id);
CREATE INDEX IF NOT EXISTS idx_stripe_access_log_business ON stripe_key_access_log(business_id, accessed_at DESC);

-- Extra product columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_tracking_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_reorder_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_quantity integer;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_info jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_velocity numeric(10, 2);

-- Extra customer_profiles columns
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS segment_ids uuid[];
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS lifetime_value numeric(10, 2);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS engagement_score integer;
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS last_engagement_at timestamptz;

-- RLS on new tables
ALTER TABLE inventory_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_velocity ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE smart_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_cache ENABLE ROW LEVEL SECURITY;

-- Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_product_batches_updated_at ON product_batches;
CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON product_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_promo_campaigns_updated_at ON promo_campaigns;
CREATE TRIGGER update_promo_campaigns_updated_at BEFORE UPDATE ON promo_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_smart_bundles_updated_at ON smart_bundles;
CREATE TRIGGER update_smart_bundles_updated_at BEFORE UPDATE ON smart_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_recipes_updated_at ON recipes;
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$ BEGIN RAISE NOTICE '[4/6] AI/inventory tables created'; END $$;


-- ============================================================
-- FIX 5: Slug index (performance)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_businesses_slug_active ON businesses(slug) WHERE is_active = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_slug_unique') THEN
    ALTER TABLE businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN RAISE NOTICE '[5/6] Slug index OK'; END $$;


-- ============================================================
-- FIX 6: Auto-onboarding trigger
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_business_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _meta jsonb; _role text; _business_name text; _slug text; _base_slug text;
  _email text; _phone text; _business_type text; _plan text;
  _business_id uuid; _slug_suffix int := 0; _slug_exists boolean;
BEGIN
  _meta := NEW.raw_user_meta_data;
  _role := _meta->>'role';
  IF _role IS NULL OR _role != 'business_owner' THEN RETURN NEW; END IF;
  _business_name := _meta->>'business_name';
  _slug := _meta->>'business_slug';
  _email := NEW.email;
  _phone := _meta->>'phone';
  _business_type := _meta->>'business_type';
  _plan := COALESCE(_meta->>'plan', 'solo');
  IF _business_name IS NULL OR _business_name = '' THEN RETURN NEW; END IF;
  IF _slug IS NULL OR _slug = '' THEN
    _slug := lower(regexp_replace(regexp_replace(_business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;
  _base_slug := _slug;
  LOOP
    SELECT EXISTS(SELECT 1 FROM businesses WHERE slug = _slug) INTO _slug_exists;
    EXIT WHEN NOT _slug_exists;
    _slug_suffix := _slug_suffix + 1;
    _slug := _base_slug || '-' || _slug_suffix;
  END LOOP;
  INSERT INTO businesses (slug, name, owner_email, phone, business_type, subscription_tier, is_active, trial_ends_at, created_at)
  VALUES (_slug, _business_name, _email, _phone, _business_type, _plan, true, now() + interval '30 days', now())
  RETURNING id INTO _business_id;
  INSERT INTO user_businesses (user_id, business_id, role) VALUES (NEW.id, _business_id, 'owner');
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_business_owner failed: %', SQLERRM;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created_business ON auth.users;
CREATE TRIGGER on_auth_user_created_business
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_business_owner();

DO $$ BEGIN RAISE NOTICE '[6/6] Auto-onboarding trigger OK'; END $$;


-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
DECLARE tbl_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO tbl_count FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'FIX COMPLETE - Total public tables: %', tbl_count;
  RAISE NOTICE '========================================';
END $$;
