-- Insert Isha's Treat business record if it doesn't exist
-- Run this in Supabase SQL Editor

INSERT INTO businesses (
    slug,
    name,
    owner_email,
    phone,
    country,
    currency,
    timezone,
    is_active
)
VALUES (
    'ishas-treat',
    'Isha''s Treat & Groceries',
    'Info@ishastreatandgroceriescom.uk',
    '+44 7935 238972',
    'United Kingdom',
    'GBP',
    'Europe/London',
    true
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    owner_email = EXCLUDED.owner_email,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- Verify the insertion
SELECT id, slug, name, owner_email, is_active, created_at
FROM businesses
WHERE slug = 'ishas-treat';
