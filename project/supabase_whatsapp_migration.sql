-- ============================================================================
-- APINLERO WHATSAPP MULTI-TENANT MIGRATION
-- Run this in Supabase SQL Editor to set up WhatsApp Cloud API support
-- ============================================================================

-- 1. Create businesses table (core multi-tenant table)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier
    owner_email TEXT NOT NULL,

    -- Business details
    phone TEXT,
    address TEXT,
    city TEXT,
    country TEXT DEFAULT 'Nigeria',
    currency TEXT DEFAULT 'NGN',
    timezone TEXT DEFAULT 'Africa/Lagos',

    -- Subscription & limits
    plan TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
    monthly_message_limit INTEGER DEFAULT 1000,
    messages_used_this_month INTEGER DEFAULT 0,
    billing_cycle_start DATE DEFAULT CURRENT_DATE,

    -- Settings
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_email);
CREATE INDEX IF NOT EXISTS idx_businesses_active ON businesses(is_active) WHERE is_active = true;

-- 2. Create whatsapp_configs table (one per business)
CREATE TABLE IF NOT EXISTS whatsapp_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- WhatsApp Cloud API credentials
    phone_number_id TEXT, -- Meta Phone Number ID
    waba_id TEXT, -- WhatsApp Business Account ID
    access_token TEXT, -- Encrypted access token (use Supabase vault in production)

    -- Twilio fallback credentials (optional)
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    twilio_phone_number TEXT,

    -- Webhook configuration
    webhook_verify_token TEXT NOT NULL, -- For Meta webhook verification
    webhook_secret TEXT, -- For signature validation

    -- Provider selection
    provider TEXT DEFAULT 'meta', -- 'meta' or 'twilio'

    -- Display info
    display_phone_number TEXT, -- Human-readable phone number
    business_name TEXT,

    -- Status
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_webhook_at TIMESTAMPTZ,
    last_error TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT unique_business_whatsapp UNIQUE (business_id),
    CONSTRAINT unique_phone_number_id UNIQUE (phone_number_id)
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_business ON whatsapp_configs(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_phone_id ON whatsapp_configs(phone_number_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_configs_provider ON whatsapp_configs(provider);

-- 3. Create whatsapp_message_logs table (for analytics)
CREATE TABLE IF NOT EXISTS whatsapp_message_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Message details
    message_id TEXT, -- WhatsApp message ID
    direction TEXT NOT NULL, -- 'inbound' or 'outbound'
    customer_phone TEXT NOT NULL,

    -- Content
    message_type TEXT NOT NULL, -- 'text', 'image', 'audio', 'video', 'document', 'template', 'interactive'
    content TEXT, -- Message text or caption
    media_url TEXT, -- URL for media messages
    template_name TEXT, -- For template messages

    -- Status tracking
    status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    error_code TEXT,
    error_message TEXT,

    -- Processing info
    intent_detected TEXT, -- Bot's detected intent
    response_time_ms INTEGER, -- How long bot took to respond

    -- Provider info
    provider TEXT DEFAULT 'meta', -- 'meta' or 'twilio'
    raw_payload JSONB, -- Original webhook payload

    -- Timestamps
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_message_logs_business ON whatsapp_message_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_customer ON whatsapp_message_logs(customer_phone);
CREATE INDEX IF NOT EXISTS idx_message_logs_timestamp ON whatsapp_message_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_direction ON whatsapp_message_logs(direction);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON whatsapp_message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_message_id ON whatsapp_message_logs(message_id);

-- 4. Create whatsapp_templates table (for approved message templates)
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Template info
    template_name TEXT NOT NULL,
    template_id TEXT, -- Meta template ID
    language TEXT DEFAULT 'en',
    category TEXT, -- 'MARKETING', 'UTILITY', 'AUTHENTICATION'

    -- Content
    header_type TEXT, -- 'TEXT', 'IMAGE', 'VIDEO', 'DOCUMENT', 'NONE'
    header_content TEXT,
    body_text TEXT NOT NULL,
    footer_text TEXT,
    buttons JSONB, -- Button configurations

    -- Status
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    rejection_reason TEXT,

    -- Usage stats
    times_used INTEGER DEFAULT 0,
    last_used_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_template_per_business UNIQUE (business_id, template_name)
);

CREATE INDEX IF NOT EXISTS idx_templates_business ON whatsapp_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_templates_status ON whatsapp_templates(status);

-- 5. Create whatsapp_sessions table (conversation state)
CREATE TABLE IF NOT EXISTS whatsapp_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_phone TEXT NOT NULL,

    -- Session state
    current_state TEXT DEFAULT 'idle', -- Bot conversation state
    context JSONB DEFAULT '{}', -- Conversation context
    cart JSONB DEFAULT '[]', -- Shopping cart items

    -- Customer info (cached for quick access)
    customer_name TEXT,
    customer_id UUID, -- Reference to customers table if exists

    -- Conversation window
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    conversation_started_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_session_per_business_customer UNIQUE (business_id, customer_phone)
);

CREATE INDEX IF NOT EXISTS idx_sessions_business ON whatsapp_sessions(business_id);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON whatsapp_sessions(customer_phone);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON whatsapp_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_sessions_last_message ON whatsapp_sessions(last_message_at DESC);

-- 6. Create whatsapp_analytics_daily table (aggregated stats)
CREATE TABLE IF NOT EXISTS whatsapp_analytics_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- Message counts
    messages_received INTEGER DEFAULT 0,
    messages_sent INTEGER DEFAULT 0,
    messages_delivered INTEGER DEFAULT 0,
    messages_read INTEGER DEFAULT 0,
    messages_failed INTEGER DEFAULT 0,

    -- Conversation counts
    conversations_started INTEGER DEFAULT 0,
    conversations_completed INTEGER DEFAULT 0,

    -- Unique customers
    unique_customers INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,

    -- Orders via WhatsApp
    orders_created INTEGER DEFAULT 0,
    orders_value DECIMAL(10,2) DEFAULT 0,

    -- Response metrics
    avg_response_time_ms INTEGER,

    -- Intent breakdown
    intent_breakdown JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_analytics_per_day UNIQUE (business_id, date)
);

CREATE INDEX IF NOT EXISTS idx_analytics_business ON whatsapp_analytics_daily(business_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON whatsapp_analytics_daily(date DESC);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- 7. Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_analytics_daily ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for businesses
CREATE POLICY "Service role full access to businesses"
ON businesses FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can view their own businesses"
ON businesses FOR SELECT
TO authenticated
USING (owner_email = auth.jwt() ->> 'email');

CREATE POLICY "Users can update their own businesses"
ON businesses FOR UPDATE
TO authenticated
USING (owner_email = auth.jwt() ->> 'email');

-- 9. RLS Policies for whatsapp_configs
CREATE POLICY "Service role full access to whatsapp_configs"
ON whatsapp_configs FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can view their business whatsapp_configs"
ON whatsapp_configs FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
    )
);

CREATE POLICY "Users can manage their business whatsapp_configs"
ON whatsapp_configs FOR ALL
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
    )
);

-- 10. RLS Policies for whatsapp_message_logs
CREATE POLICY "Service role full access to whatsapp_message_logs"
ON whatsapp_message_logs FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can view their business message_logs"
ON whatsapp_message_logs FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
    )
);

-- 11. RLS Policies for whatsapp_templates
CREATE POLICY "Service role full access to whatsapp_templates"
ON whatsapp_templates FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can manage their business templates"
ON whatsapp_templates FOR ALL
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
    )
);

-- 12. RLS Policies for whatsapp_sessions
CREATE POLICY "Service role full access to whatsapp_sessions"
ON whatsapp_sessions FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can view their business sessions"
ON whatsapp_sessions FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
    )
);

-- 13. RLS Policies for whatsapp_analytics_daily
CREATE POLICY "Service role full access to whatsapp_analytics_daily"
ON whatsapp_analytics_daily FOR ALL
TO service_role
USING (true);

CREATE POLICY "Users can view their business analytics"
ON whatsapp_analytics_daily FOR SELECT
TO authenticated
USING (
    business_id IN (
        SELECT id FROM businesses WHERE owner_email = auth.jwt() ->> 'email'
    )
);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- 14. Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_businesses_updated_at ON businesses;
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_configs_updated_at ON whatsapp_configs;
CREATE TRIGGER update_whatsapp_configs_updated_at
    BEFORE UPDATE ON whatsapp_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_sessions_updated_at ON whatsapp_sessions;
CREATE TRIGGER update_whatsapp_sessions_updated_at
    BEFORE UPDATE ON whatsapp_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_templates_updated_at ON whatsapp_templates;
CREATE TRIGGER update_whatsapp_templates_updated_at
    BEFORE UPDATE ON whatsapp_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

DROP TRIGGER IF EXISTS update_whatsapp_analytics_updated_at ON whatsapp_analytics_daily;
CREATE TRIGGER update_whatsapp_analytics_updated_at
    BEFORE UPDATE ON whatsapp_analytics_daily
    FOR EACH ROW
    EXECUTE FUNCTION update_whatsapp_updated_at();

-- 15. Function to get business by phone_number_id
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

-- 16. Function to log message and update analytics
CREATE OR REPLACE FUNCTION log_whatsapp_message(
    p_business_id UUID,
    p_message_id TEXT,
    p_direction TEXT,
    p_customer_phone TEXT,
    p_message_type TEXT,
    p_content TEXT DEFAULT NULL,
    p_provider TEXT DEFAULT 'meta',
    p_intent TEXT DEFAULT NULL,
    p_response_time_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    -- Insert message log
    INSERT INTO whatsapp_message_logs (
        business_id, message_id, direction, customer_phone,
        message_type, content, provider, intent_detected, response_time_ms
    ) VALUES (
        p_business_id, p_message_id, p_direction, p_customer_phone,
        p_message_type, p_content, p_provider, p_intent, p_response_time_ms
    )
    RETURNING id INTO v_log_id;

    -- Update daily analytics
    INSERT INTO whatsapp_analytics_daily (business_id, date, messages_received, messages_sent)
    VALUES (
        p_business_id,
        CURRENT_DATE,
        CASE WHEN p_direction = 'inbound' THEN 1 ELSE 0 END,
        CASE WHEN p_direction = 'outbound' THEN 1 ELSE 0 END
    )
    ON CONFLICT (business_id, date) DO UPDATE SET
        messages_received = whatsapp_analytics_daily.messages_received +
            CASE WHEN p_direction = 'inbound' THEN 1 ELSE 0 END,
        messages_sent = whatsapp_analytics_daily.messages_sent +
            CASE WHEN p_direction = 'outbound' THEN 1 ELSE 0 END,
        updated_at = NOW();

    -- Update business message count
    UPDATE businesses
    SET messages_used_this_month = messages_used_this_month + 1
    WHERE id = p_business_id;

    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Function to get or create session
CREATE OR REPLACE FUNCTION get_or_create_session(
    p_business_id UUID,
    p_customer_phone TEXT,
    p_customer_name TEXT DEFAULT NULL
)
RETURNS whatsapp_sessions AS $$
DECLARE
    v_session whatsapp_sessions;
BEGIN
    -- Try to get existing active session
    SELECT * INTO v_session
    FROM whatsapp_sessions
    WHERE business_id = p_business_id
    AND customer_phone = p_customer_phone
    AND is_active = true
    AND last_message_at > NOW() - INTERVAL '24 hours';

    -- If no session, create new one
    IF v_session IS NULL THEN
        INSERT INTO whatsapp_sessions (
            business_id, customer_phone, customer_name
        ) VALUES (
            p_business_id, p_customer_phone, p_customer_name
        )
        ON CONFLICT (business_id, customer_phone) DO UPDATE SET
            is_active = true,
            conversation_started_at = NOW(),
            last_message_at = NOW(),
            current_state = 'idle',
            context = '{}',
            cart = '[]'
        RETURNING * INTO v_session;
    ELSE
        -- Update last message time
        UPDATE whatsapp_sessions
        SET last_message_at = NOW()
        WHERE id = v_session.id
        RETURNING * INTO v_session;
    END IF;

    RETURN v_session;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 18. Function to reset monthly message counts (run on 1st of month)
CREATE OR REPLACE FUNCTION reset_monthly_message_counts()
RETURNS INTEGER AS $$
DECLARE
    v_updated INTEGER;
BEGIN
    UPDATE businesses
    SET
        messages_used_this_month = 0,
        billing_cycle_start = CURRENT_DATE
    WHERE billing_cycle_start < DATE_TRUNC('month', CURRENT_DATE);

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 19. Function to generate webhook verify token
CREATE OR REPLACE FUNCTION generate_webhook_verify_token()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN (
    'businesses', 'whatsapp_configs', 'whatsapp_message_logs',
    'whatsapp_templates', 'whatsapp_sessions', 'whatsapp_analytics_daily'
);

-- Check indexes
SELECT indexname, tablename FROM pg_indexes
WHERE tablename IN (
    'businesses', 'whatsapp_configs', 'whatsapp_message_logs',
    'whatsapp_templates', 'whatsapp_sessions', 'whatsapp_analytics_daily'
);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE businesses IS 'Multi-tenant business accounts for Apinlero SaaS';
COMMENT ON TABLE whatsapp_configs IS 'WhatsApp Cloud API and Twilio configurations per business';
COMMENT ON TABLE whatsapp_message_logs IS 'All WhatsApp messages for analytics and debugging';
COMMENT ON TABLE whatsapp_templates IS 'Approved WhatsApp message templates per business';
COMMENT ON TABLE whatsapp_sessions IS 'Active conversation sessions with customers';
COMMENT ON TABLE whatsapp_analytics_daily IS 'Aggregated daily WhatsApp metrics per business';

-- ============================================================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================================================

-- Uncomment to insert test data:
/*
INSERT INTO businesses (name, slug, owner_email, phone, city) VALUES
('Apinlero Demo', 'apinlero-demo', 'demo@apinlero.com', '+2348012345678', 'Lagos');

INSERT INTO whatsapp_configs (
    business_id,
    phone_number_id,
    webhook_verify_token,
    display_phone_number,
    business_name,
    provider
) VALUES (
    (SELECT id FROM businesses WHERE slug = 'apinlero-demo'),
    'YOUR_PHONE_NUMBER_ID',
    generate_webhook_verify_token(),
    '+234 801 234 5678',
    'Apinlero Demo',
    'meta'
);
*/
