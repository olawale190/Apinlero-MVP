-- ============================================================================
-- APINLERO STORAGE MANAGEMENT MIGRATION
-- Run this in Supabase SQL Editor to set up storage tracking
-- ============================================================================

-- 1. Create media_files table to track all stored files
CREATE TABLE IF NOT EXISTS media_files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    bucket_name TEXT NOT NULL DEFAULT 'apinlero-media',
    file_type TEXT, -- 'image', 'audio', 'video', 'document'
    mime_type TEXT,
    file_size_bytes BIGINT,
    source TEXT NOT NULL DEFAULT 'manual', -- 'whatsapp', 'web', 'n8n', 'manual'

    -- Relationships
    customer_phone TEXT,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    expires_at TIMESTAMPTZ, -- For temporary files

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create index for common queries
CREATE INDEX IF NOT EXISTS idx_media_files_customer ON media_files(customer_phone);
CREATE INDEX IF NOT EXISTS idx_media_files_order ON media_files(order_id);
CREATE INDEX IF NOT EXISTS idx_media_files_source ON media_files(source);
CREATE INDEX IF NOT EXISTS idx_media_files_bucket ON media_files(bucket_name);
CREATE INDEX IF NOT EXISTS idx_media_files_created ON media_files(created_at DESC);

-- 3. Create storage_usage table to track usage over time
CREATE TABLE IF NOT EXISTS storage_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    bucket_name TEXT NOT NULL,
    file_count INTEGER DEFAULT 0,
    total_size_bytes BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_storage_usage_date ON storage_usage(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_usage_bucket ON storage_usage(bucket_name);

-- 4. Create daily_reports table to store generated reports
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    report_date DATE NOT NULL UNIQUE,
    report_type TEXT DEFAULT 'daily_summary',

    -- Metrics
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    new_customers INTEGER DEFAULT 0,

    -- Channel breakdown
    whatsapp_orders INTEGER DEFAULT 0,
    web_orders INTEGER DEFAULT 0,
    phone_orders INTEGER DEFAULT 0,
    walkin_orders INTEGER DEFAULT 0,

    -- Inventory alerts
    low_stock_count INTEGER DEFAULT 0,
    expiring_soon_count INTEGER DEFAULT 0,

    -- Full report data
    report_data JSONB DEFAULT '{}',
    file_path TEXT, -- Link to stored report file

    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date DESC);

-- 5. Create backups tracking table
CREATE TABLE IF NOT EXISTS backup_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    backup_date DATE NOT NULL,
    backup_type TEXT DEFAULT 'full', -- 'full', 'incremental', 'media_only'
    file_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    records_count JSONB DEFAULT '{}', -- {"orders": 100, "products": 50, "customers": 30}
    status TEXT DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_date ON backup_logs(backup_date DESC);

-- 6. Enable RLS on new tables
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for media_files
CREATE POLICY "Service role full access to media_files"
ON media_files FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view media_files"
ON media_files FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert media_files"
ON media_files FOR INSERT
TO authenticated
WITH CHECK (true);

-- 8. RLS Policies for storage_usage
CREATE POLICY "Service role full access to storage_usage"
ON storage_usage FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view storage_usage"
ON storage_usage FOR SELECT
TO authenticated
USING (true);

-- 9. RLS Policies for daily_reports
CREATE POLICY "Service role full access to daily_reports"
ON daily_reports FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view daily_reports"
ON daily_reports FOR SELECT
TO authenticated
USING (true);

-- 10. RLS Policies for backup_logs
CREATE POLICY "Service role full access to backup_logs"
ON backup_logs FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view backup_logs"
ON backup_logs FOR SELECT
TO authenticated
USING (true);

-- 11. Create storage buckets (run separately or via dashboard)
-- Note: Bucket creation via SQL requires superuser privileges
-- Create these manually in Supabase Dashboard > Storage:
-- - apinlero-media (private)
-- - apinlero-documents (private)
-- - apinlero-products (public)

-- 12. Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 13. Trigger for media_files updated_at
DROP TRIGGER IF EXISTS update_media_files_updated_at ON media_files;
CREATE TRIGGER update_media_files_updated_at
    BEFORE UPDATE ON media_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 14. Function to calculate storage usage
CREATE OR REPLACE FUNCTION calculate_storage_usage()
RETURNS TABLE (
    bucket TEXT,
    file_count BIGINT,
    total_bytes BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        bucket_name as bucket,
        COUNT(*) as file_count,
        COALESCE(SUM(file_size_bytes), 0) as total_bytes
    FROM media_files
    GROUP BY bucket_name;
END;
$$ LANGUAGE plpgsql;

-- 15. Function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM media_files
    WHERE expires_at IS NOT NULL
    AND expires_at < NOW();

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables were created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('media_files', 'storage_usage', 'daily_reports', 'backup_logs');

-- Check indexes
SELECT indexname FROM pg_indexes
WHERE tablename IN ('media_files', 'storage_usage', 'daily_reports', 'backup_logs');

COMMENT ON TABLE media_files IS 'Tracks all files stored in Supabase Storage buckets';
COMMENT ON TABLE storage_usage IS 'Historical record of storage usage for monitoring';
COMMENT ON TABLE daily_reports IS 'Stores daily business reports generated by n8n';
COMMENT ON TABLE backup_logs IS 'Tracks all backup operations for audit trail';
