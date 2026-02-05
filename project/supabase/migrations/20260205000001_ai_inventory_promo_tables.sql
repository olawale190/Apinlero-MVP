-- ==============================================================================
-- ÀPÍNLẸ̀RỌ AI-POWERED INVENTORY & PROMOTIONAL SYSTEM
-- Migration: 20260205000001
-- Description: Creates tables for AI-powered inventory management, promotional
--              campaigns, smart bundles, and customer engagement tracking
-- ==============================================================================

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- AI INVENTORY MANAGEMENT TABLES
-- ============================================================================

-- Inventory insights and AI recommendations
CREATE TABLE IF NOT EXISTS inventory_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  insight_type text NOT NULL CHECK (insight_type IN (
    'reorder_suggestion', 'expiry_warning', 'stock_optimization',
    'bundle_recommendation', 'seasonal_prediction', 'waste_alert',
    'velocity_analysis', 'demand_forecast'
  )),

  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  product_ids uuid[], -- For bundle recommendations

  title text NOT NULL,
  description text NOT NULL,
  ai_reasoning text, -- Claude's explanation

  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  confidence_score numeric(3, 2), -- 0.00 to 1.00

  -- Actionable data
  recommended_action jsonb, -- {"action": "reorder", "quantity": 50, "timing": "2 days"}
  expected_impact jsonb, -- {"revenue_increase": 250, "waste_reduction": 15}

  -- Tracking
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  actioned_at timestamptz,
  outcome_notes text,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz -- Time-sensitive insights
);

CREATE INDEX idx_inventory_insights_business ON inventory_insights(business_id);
CREATE INDEX idx_inventory_insights_type ON inventory_insights(insight_type);
CREATE INDEX idx_inventory_insights_status ON inventory_insights(status) WHERE status = 'pending';
CREATE INDEX idx_inventory_insights_priority ON inventory_insights(priority) WHERE priority IN ('high', 'critical');

COMMENT ON TABLE inventory_insights IS 'AI-generated inventory insights and recommendations';
COMMENT ON COLUMN inventory_insights.ai_reasoning IS 'Claude AI explanation of why this recommendation was made';

-- Product expiry tracking
CREATE TABLE IF NOT EXISTS product_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  batch_number text NOT NULL,
  quantity integer NOT NULL CHECK (quantity >= 0),
  cost_per_unit numeric(10, 2) CHECK (cost_per_unit >= 0),

  received_date date NOT NULL,
  expiry_date date,
  days_until_expiry integer GENERATED ALWAYS AS (
    CASE WHEN expiry_date IS NOT NULL
    THEN EXTRACT(day FROM (expiry_date - CURRENT_DATE))::integer
    ELSE NULL END
  ) STORED,

  location text, -- Warehouse location
  supplier_name text,

  status text DEFAULT 'active' CHECK (status IN ('active', 'expiring_soon', 'expired', 'sold', 'discarded')),

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_product_batches_business ON product_batches(business_id);
CREATE INDEX idx_product_batches_product ON product_batches(product_id);
CREATE INDEX idx_product_batches_expiry ON product_batches(expiry_date) WHERE expiry_date IS NOT NULL;
CREATE INDEX idx_product_batches_status ON product_batches(status);
CREATE INDEX idx_product_batches_days_until_expiry ON product_batches(days_until_expiry) WHERE days_until_expiry IS NOT NULL;

COMMENT ON TABLE product_batches IS 'Track product batches with expiry dates for waste prevention';

-- Sales velocity tracking (for predictive reordering)
CREATE TABLE IF NOT EXISTS product_velocity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,

  period_start date NOT NULL,
  period_end date NOT NULL,

  units_sold integer DEFAULT 0,
  revenue numeric(10, 2) DEFAULT 0,
  avg_daily_sales numeric(10, 2), -- Units per day

  trend text CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  trend_percentage numeric(5, 2), -- +/- percentage change

  seasonal_factor numeric(3, 2), -- Multiplier based on cultural events
  cultural_events text[], -- Events during this period

  created_at timestamptz DEFAULT now(),

  UNIQUE(business_id, product_id, period_start, period_end)
);

CREATE INDEX idx_product_velocity_business ON product_velocity(business_id);
CREATE INDEX idx_product_velocity_product ON product_velocity(product_id);
CREATE INDEX idx_product_velocity_period ON product_velocity(period_start, period_end);

COMMENT ON TABLE product_velocity IS 'Track sales velocity for predictive reordering and demand forecasting';

-- ============================================================================
-- AI PROMOTIONAL SYSTEM TABLES
-- ============================================================================

-- Smart promotional campaigns
CREATE TABLE IF NOT EXISTS promo_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,
  description text,

  campaign_type text NOT NULL CHECK (campaign_type IN (
    'flash_sale', 'bundle_offer', 'seasonal', 'win_back',
    'loyalty_reward', 'new_product', 'cultural_event', 'custom'
  )),

  -- AI-generated details
  ai_generated boolean DEFAULT false,
  ai_reasoning text, -- Why Claude suggested this

  -- Products involved
  product_ids uuid[],
  bundle_config jsonb, -- Bundle details: [{"product_id": "...", "quantity": 2, "price": 25}]

  -- Discount configuration
  discount_type text CHECK (discount_type IN ('percentage', 'fixed_amount', 'buy_x_get_y', 'free_shipping')),
  discount_value numeric(10, 2),

  -- Targeting
  target_segment text CHECK (target_segment IN ('all', 'new_customers', 'returning', 'inactive', 'vip', 'custom')),
  target_criteria jsonb, -- Custom SQL filters or customer attributes
  estimated_reach integer,

  -- Messaging
  message_template text NOT NULL, -- WhatsApp/Email message
  visual_card_url text, -- Generated promotional image

  -- Scheduling
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  send_time time, -- Optimal send time (AI-determined)

  -- Distribution channels
  channels text[] DEFAULT ARRAY['whatsapp', 'email'],

  -- Performance tracking
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  sent_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  converted_count integer DEFAULT 0,
  revenue_generated numeric(10, 2) DEFAULT 0,

  -- A/B Testing
  is_ab_test boolean DEFAULT false,
  ab_variant text, -- 'A' or 'B'
  ab_test_id uuid, -- Link to parent campaign for comparison

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_promo_campaigns_business ON promo_campaigns(business_id);
CREATE INDEX idx_promo_campaigns_status ON promo_campaigns(status);
CREATE INDEX idx_promo_campaigns_dates ON promo_campaigns(start_date, end_date);
CREATE INDEX idx_promo_campaigns_type ON promo_campaigns(campaign_type);
CREATE INDEX idx_promo_campaigns_ai_generated ON promo_campaigns(ai_generated) WHERE ai_generated = true;

COMMENT ON TABLE promo_campaigns IS 'AI-powered promotional campaigns with multi-channel distribution';

-- Campaign engagement tracking
CREATE TABLE IF NOT EXISTS campaign_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  campaign_id uuid REFERENCES promo_campaigns(id) ON DELETE CASCADE NOT NULL,

  customer_phone text NOT NULL,
  customer_email text,
  customer_id uuid, -- If they have an account

  -- Engagement events
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  converted_at timestamptz,

  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  order_value numeric(10, 2),

  channel text NOT NULL CHECK (channel IN ('whatsapp', 'email')),

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_campaign_engagement_campaign ON campaign_engagement(campaign_id);
CREATE INDEX idx_campaign_engagement_customer ON campaign_engagement(customer_phone);
CREATE INDEX idx_campaign_engagement_business ON campaign_engagement(business_id);
CREATE INDEX idx_campaign_engagement_converted ON campaign_engagement(converted_at) WHERE converted_at IS NOT NULL;

COMMENT ON TABLE campaign_engagement IS 'Track customer engagement with promotional campaigns';

-- AI-generated product bundles
CREATE TABLE IF NOT EXISTS smart_bundles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL, -- e.g., "Jollof Party Pack"
  description text,

  -- Bundle composition
  items jsonb NOT NULL, -- [{"product_id": "...", "quantity": 2, "price": 10}]
  total_value numeric(10, 2) NOT NULL, -- Sum of individual prices
  bundle_price numeric(10, 2) NOT NULL, -- Discounted bundle price
  savings numeric(10, 2) GENERATED ALWAYS AS (total_value - bundle_price) STORED,
  savings_percentage numeric(5, 2) GENERATED ALWAYS AS (
    CASE WHEN total_value > 0
    THEN ((total_value - bundle_price) / total_value * 100)::numeric(5, 2)
    ELSE 0 END
  ) STORED,

  -- AI generation context
  ai_generated boolean DEFAULT false,
  generation_reason text, -- "Based on purchase patterns", "Cultural event: Eid"
  confidence_score numeric(3, 2),

  -- Cultural context
  cultural_event_id uuid REFERENCES calendar_events(id) ON DELETE SET NULL,
  recipe_suggestion text, -- Optional recipe that uses these items

  -- Performance
  times_suggested integer DEFAULT 0,
  times_purchased integer DEFAULT 0,
  conversion_rate numeric(5, 2),

  is_active boolean DEFAULT true,

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_smart_bundles_business ON smart_bundles(business_id);
CREATE INDEX idx_smart_bundles_active ON smart_bundles(is_active) WHERE is_active = true;
CREATE INDEX idx_smart_bundles_event ON smart_bundles(cultural_event_id);
CREATE INDEX idx_smart_bundles_ai_generated ON smart_bundles(ai_generated) WHERE ai_generated = true;

COMMENT ON TABLE smart_bundles IS 'AI-generated product bundles based on purchase patterns and cultural events';

-- Customer segmentation (AI-powered)
CREATE TABLE IF NOT EXISTS customer_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL, -- e.g., "VIP Jollof Lovers"
  description text,

  segment_type text CHECK (segment_type IN ('behavioral', 'demographic', 'rfm', 'ai_discovered', 'custom')),

  -- Segment criteria (AI-generated or manual)
  criteria jsonb NOT NULL, -- SQL-like filters
  ai_generated boolean DEFAULT false,
  ai_reasoning text,

  customer_count integer DEFAULT 0,
  avg_order_value numeric(10, 2),
  total_revenue numeric(10, 2),

  -- Engagement recommendations
  recommended_actions jsonb, -- AI suggestions for this segment

  is_active boolean DEFAULT true,
  last_updated timestamptz DEFAULT now(),

  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_customer_segments_business ON customer_segments(business_id);
CREATE INDEX idx_customer_segments_active ON customer_segments(is_active) WHERE is_active = true;
CREATE INDEX idx_customer_segments_type ON customer_segments(segment_type);

COMMENT ON TABLE customer_segments IS 'Customer segmentation for targeted marketing campaigns';

-- ============================================================================
-- AI CONVERSATION HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  conversation_type text CHECK (conversation_type IN ('inventory_management', 'promotion_creation', 'analytics_query', 'general')),

  -- Conversation thread
  messages jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of {role, content, timestamp}

  -- Context
  user_id uuid, -- Business owner
  session_id text,
  channel text DEFAULT 'web' CHECK (channel IN ('web', 'whatsapp', 'api')),

  -- Outcomes
  actions_taken jsonb, -- What the AI did: created promo, updated stock, etc.

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_conversations_business ON ai_conversations(business_id);
CREATE INDEX idx_ai_conversations_type ON ai_conversations(conversation_type);
CREATE INDEX idx_ai_conversations_created ON ai_conversations(created_at DESC);

COMMENT ON TABLE ai_conversations IS 'Store AI conversation history for context and analytics';

-- ============================================================================
-- RECIPES & CULTURAL KNOWLEDGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE,

  name text NOT NULL,
  description text,
  cuisine text, -- Nigerian, Jamaican, etc.
  difficulty text CHECK (difficulty IN ('easy', 'medium', 'hard')),
  prep_time_minutes integer,
  serves integer,
  instructions text[],
  image_url text,
  cultural_context text,

  -- Community features
  submitted_by_customer_id uuid,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  views integer DEFAULT 0,
  times_cooked integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id uuid REFERENCES recipes(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity text, -- "2 cups", "500g"
  is_optional boolean DEFAULT false,
  PRIMARY KEY (recipe_id, product_id)
);

CREATE INDEX idx_recipes_business ON recipes(business_id);
CREATE INDEX idx_recipes_cuisine ON recipes(cuisine);
CREATE INDEX idx_recipes_featured ON recipes(is_featured) WHERE is_featured = true;
CREATE INDEX idx_recipe_ingredients_product ON recipe_ingredients(product_id);

COMMENT ON TABLE recipes IS 'Recipe database for bundle suggestions and customer engagement';

-- ============================================================================
-- AI USAGE TRACKING & CACHING
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid,
  endpoint text, -- 'ai-assistant', 'promo-creator', etc.
  tokens_used integer,
  cost numeric(10, 4), -- Calculated from tokens
  response_time_ms integer,
  success boolean,
  error_message text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_usage_logs_business ON ai_usage_logs(business_id);
CREATE INDEX idx_ai_usage_logs_created ON ai_usage_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS ai_response_cache (
  cache_key text PRIMARY KEY,
  response jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_ai_cache_created ON ai_response_cache(created_at);

COMMENT ON TABLE ai_usage_logs IS 'Track AI API usage for billing and performance monitoring';
COMMENT ON TABLE ai_response_cache IS 'Cache AI responses to reduce API costs';

-- Auto-cleanup old cache entries (24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM ai_response_cache
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXTEND EXISTING PRODUCTS TABLE
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_tracking_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS auto_reorder_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_point integer; -- Auto-reorder when stock hits this
ALTER TABLE products ADD COLUMN IF NOT EXISTS reorder_quantity integer; -- How much to reorder
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_info jsonb; -- Supplier details
ALTER TABLE products ADD COLUMN IF NOT EXISTS avg_velocity numeric(10, 2); -- Cached average daily sales

COMMENT ON COLUMN products.expiry_tracking_enabled IS 'Enable batch-level expiry tracking for this product';
COMMENT ON COLUMN products.auto_reorder_enabled IS 'Enable automatic reordering when stock hits reorder point';
COMMENT ON COLUMN products.avg_velocity IS 'Cached average daily sales (units per day)';

-- ============================================================================
-- EXTEND EXISTING CUSTOMER_PROFILES TABLE
-- ============================================================================

ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS segment_ids uuid[]; -- Which segments they belong to
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb; -- Dietary, cultural preferences
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS lifetime_value numeric(10, 2);
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS engagement_score integer CHECK (engagement_score >= 0 AND engagement_score <= 100); -- 0-100 score
ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS last_engagement_at timestamptz;

COMMENT ON COLUMN customer_profiles.segment_ids IS 'Customer segments this profile belongs to';
COMMENT ON COLUMN customer_profiles.engagement_score IS 'Engagement score from 0-100 based on activity';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

CREATE TRIGGER update_product_batches_updated_at
  BEFORE UPDATE ON product_batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promo_campaigns_updated_at
  BEFORE UPDATE ON promo_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_smart_bundles_updated_at
  BEFORE UPDATE ON smart_bundles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all new tables
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

-- Basic RLS policies (businesses can only see their own data)
CREATE POLICY "Users can view their business insights" ON inventory_insights
  FOR SELECT USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()::uuid
  ));

CREATE POLICY "Users can manage their business insights" ON inventory_insights
  FOR ALL USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()::uuid
  ));

CREATE POLICY "Users can view their product batches" ON product_batches
  FOR SELECT USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()::uuid
  ));

CREATE POLICY "Users can manage their product batches" ON product_batches
  FOR ALL USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()::uuid
  ));

CREATE POLICY "Users can view their campaigns" ON promo_campaigns
  FOR SELECT USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()::uuid
  ));

CREATE POLICY "Users can manage their campaigns" ON promo_campaigns
  FOR ALL USING (business_id IN (
    SELECT id FROM businesses WHERE id = auth.uid()::uuid
  ));

-- Allow service role to access cache (not user-specific)
CREATE POLICY "Service role can manage cache" ON ai_response_cache
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- MONTHLY AI COST TRACKING VIEW
-- ============================================================================

CREATE OR REPLACE VIEW monthly_ai_costs AS
SELECT
  business_id,
  DATE_TRUNC('month', created_at) as month,
  SUM(tokens_used) as total_tokens,
  SUM(cost) as total_cost,
  COUNT(*) as total_calls,
  AVG(response_time_ms) as avg_response_time_ms,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful_calls,
  SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed_calls
FROM ai_usage_logs
GROUP BY business_id, DATE_TRUNC('month', created_at);

COMMENT ON VIEW monthly_ai_costs IS 'Monthly AI usage and cost tracking per business';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ AI-Powered Inventory & Promotional System tables created successfully!';
  RAISE NOTICE '📊 Created 12 new tables + extended 2 existing tables';
  RAISE NOTICE '🔒 Row Level Security enabled on all tables';
  RAISE NOTICE '🤖 Ready for Claude AI integration';
END $$;
