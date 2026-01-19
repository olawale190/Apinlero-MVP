-- ============================================================================
-- APINLERO WHATSAPP MULTI-TENANT MIGRATION v2
-- Fixed version - run this in Supabase SQL Editor
-- ============================================================================

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS whatsapp_analytics_daily CASCADE;
DROP TABLE IF EXISTS whatsapp_sessions CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_message_logs CASCADE;
DROP TABLE IF EXISTS whatsapp_configs CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;

-- ============================================================================
-- 1. Create businesses table FIRST (core multi-tenant table)
-- ============================================================================
CREATE TABLE businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Nigeria',
    currency TEXT DEFAULT 'NGN',
    timezone TEXT DEFAULT 'Africa/Lagos',
    plan TEXT DEFAULT 'free',
    monthly_message_limit INTEGER DEFAULT 1000,
    messages_used_this_month INTEGER DEFAULT 0,
    billing_cycle_start DATE DEFAULT CURRENT_DATE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_businesses_slug ON businesses(slug);
CREATE INDEX idx_businesses_owner ON businesses(owner_email);
CREATE INDEX idx_businesses_active ON businesses(is_active) WHERE is_active = true;

-- ============================================================================
-- 2. Create whatsapp_configs table (depends on businesses)
-- ============================================================================
CREATE TABLE whatsapp_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    phone_number_id TEXT,
    waba_id TEXT,
    access_token TEXT,
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    twilio_phone_number TEXT,
    webhook_verify_token TEXT NOT NULL,
    webhook_secret TEXT,
    provider TEXT DEFAULT 'meta',
    display_phone_number TEXT,
    business_name TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_webhook_at TIMESTAMPTZ,
    last_error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_business_whatsapp UNIQUE (business_id),
    CONSTRAINT unique_phone_number_id UNIQUE (phone_number_id)
);

CREATE INDEX idx_whatsapp_configs_business ON whatsapp_configs(business_id);
CREATE INDEX idx_whatsapp_configs_phone_id ON whatsapp_configs(phone_number_id);
CREATE INDEX idx_whatsapp_configs_provider ON whatsapp_configs(provider);

-- ============================================================================
-- 3. Create whatsapp_message_logs table
-- ============================================================================
CREATE TABLE whatsapp_message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    message_id TEXT,
    direction TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT,
    media_url TEXT,
    template_name TEXT,
    status TEXT DEFAULT 'sent',
    error_code TEXT,
    error_message TEXT,
    intent_detected TEXT,
    response_time_ms INTEGER,
    provider TEXT DEFAULT 'meta',
    raw_payload JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

CREATE INDEX idx_message_logs_business ON whatsapp_message_logs(business_id);
CREATE INDEX idx_message_logs_customer ON whatsapp_message_logs(customer_phone);
CREATE INDEX idx_message_logs_timestamp ON whatsapp_message_logs(timestamp DESC);
CREATE INDEX idx_message_logs_direction ON whatsapp_message_logs(direction);
CREATE INDEX idx_message_logs_status ON whatsapp_message_logs(status);
CREATE INDEX idx_message_logs_message_id ON whatsapp_message_logs(message_id);

-- ============================================================================
-- 4. Create whatsapp_templates table
-- ============================================================================
CREATE TABLE whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    template_name TEXT NOT NULL,
    template_id TEXT,
    language TEXT DEFAULT 'en',
    category TEXT,
    header_type TEXT,
    header_content TEXT,
    body_text TEXT NOT NULL,
    footer_text TEXT,
    buttons JSONB,
    status TEXT DEFAULT 'pending',
    rejection_reason TEXT,
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_template_per_business UNIQUE (business_id, template_name)
);

CREATE INDEX idx_templates_business ON whatsapp_templates(business_id);
CREATE INDEX idx_templates_status ON whatsapp_templates(status);

-- ============================================================================
-- 5. Create whatsapp_sessions table
-- ============================================================================
CREATE TABLE whatsapp_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,
    current_state TEXT DEFAULT 'idle',
    context JSONB DEFAULT '{}',
    cart JSONB DEFAULT '[]',
    customer_name TEXT,
    customer_id UUID,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    conversation_started_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_session_per_business_customer UNIQUE (business_id, customer_phone)
);

CREATE INDEX idx_sessions_business ON whatsapp_sessions(business_id);
CREATE INDEX idx_sessions_customer ON whatsapp_sessions(customer_phone);
CREATE INDEX idx_sessions_active ON whatsapp_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_last_message ON whatsapp_sessions(last_message_at DESC);

-- ============================================================================
-- 6. Create whatsapp_analytics_daily table
-- ============================================================================
CREATE TABLE whatsapp_analytics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,
    conversations_started INTEGER DEFAULT 0,
    conversations_completed INTEGER DEFAULT 0,
    unique_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    orders_created INTEGER DEFAULT 0,
    orders_value DECIMAL(10,2) DEFAULT 0,
    avg_response_time_ms INTEGER,
    intent_breakdown JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_analytics_per_day UNIQUE (business_id, date)
);

CREATE INDEX idx_analytics_business ON whatsapp_analytics_daily(business_id);
CREATE INDEX idx_analytics_date ON whatsapp_analytics_daily(date DESC);

-- ============================================================================
-- 7. Enable RLS on all tables
-- ============================================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_daily ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. RLS Policies
-- ============================================================================

-- Businesses policies
CREATE POLICY "Service role full access to businesses" ON businesses FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their own businesses" ON businesses FOR SELECT TO authenticated USING (owner_email = auth.jwt() ->> 'email');
CREATE POLICY "Users can update their own businesses" ON businesses FOR UPDATE TO authenticated USING (owner_email = auth.jwt() ->> 'email');
CREATE POLICY "Users can insert businesses" ON businesses FOR INSERT TO authenticated WITH CHECK (owner_email = auth.jwt() ->> 'email');

-- WhatsApp configs policies
CREATE POLICY "Service role full access to whatsapp_configs" ON whatsapp_configs FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their business whatsapp_configs" ON whatsapp_configs FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));
CREATE POLICY "Users can manage their business whatsapp_configs" ON whatsapp_configs FOR ALL TO authenticated USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- Message logs policies
CREATE POLICY "Service role full access to whatsapp_message_logs" ON whatsapp_message_logs FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their business message_logs" ON whatsapp_message_logs FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- Templates policies
CREATE POLICY "Service role full access to whatsapp_templates" ON whatsapp_templates FOR ALL TO service_role USING (true);
CREATE POLICY "Users can manage their business templates" ON whatsapp_templates FOR ALL TO authenticated USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- Sessions policies
CREATE POLICY "Service role full access to whatsapp_sessions" ON whatsapp_sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their business sessions" ON whatsapp_sessions FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- Analytics policies
CREATE POLICY "Service role full access to whatsapp_analytics_daily" ON whatsapp_analytics_daily FOR ALL TO service_role USING (true);
CREATE POLICY "Users can view their business analytics" ON whatsapp_analytics_daily FOR SELECT TO authenticated USING (business_id IN (SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'));

-- ============================================================================
-- 9. Triggers for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();
CREATE TRIGGER update_whatsapp_configs_updated_at BEFORE UPDATE ON whatsapp_configs FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();
CREATE TRIGGER update_whatsapp_sessions_updated_at BEFORE UPDATE ON whatsapp_sessions FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON whatsapp_templates FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();
CREATE TRIGGER update_whatsapp_analytics_updated_at BEFORE UPDATE ON whatsapp_analytics_daily FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- ============================================================================
-- 10. Helper Functions
-- ============================================================================

-- Get business by phone_number_id (for webhook routing)
CREATE OR REPLACE FUNCTION get_business_by_phone_number_id(p_phone_number_id TEXT)
RETURNS TABLE (
    business_id UUID,
    business_name TEXT,
    provider TEXT,
    access_token TEXT,
    is_active BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        wc.business_id,
        b.name as business_name,
        wc.provider,
        wc.access_token,
        wc.is_active
    FROM whatsapp_configs wc
    JOIN businesses b ON b.id = wc.business_id
    WHERE wc.phone_number_id = p_phone_number_id
    AND wc.is_active = true
    AND b.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate webhook verify token
CREATE OR REPLACE FUNCTION generate_webhook_verify_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 11. Verification - Check tables created
-- ============================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'businesses', 'whatsapp_configs', 'whatsapp_message_logs',
    'whatsapp_templates', 'whatsapp_sessions', 'whatsapp_analytics_daily'
)
ORDER BY table_name;

-- ============================================================================
-- 12. Add table comments
-- ============================================================================
COMMENT ON TABLE businesses IS 'Multi-tenant business accounts for Apinlero SaaS';
COMMENT ON TABLE whatsapp_configs IS 'WhatsApp Cloud API and Twilio configurations per business';
COMMENT ON TABLE whatsapp_message_logs IS 'All WhatsApp messages for analytics and debugging';
COMMENT ON TABLE whatsapp_templates IS 'Approved WhatsApp message templates per business';
COMMENT ON TABLE whatsapp_sessions IS 'Active conversation sessions with customers';
COMMENT ON TABLE whatsapp_analytics_daily IS 'Aggregated daily WhatsApp metrics per business';
