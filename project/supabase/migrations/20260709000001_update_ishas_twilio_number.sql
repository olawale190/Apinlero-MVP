-- Isha's Treat moved WhatsApp numbers: +447448682282 -> +447935238972 (Plan 002).
-- The 20260127 backfill migration is left untouched (already applied); this
-- migration brings any environment built from migration history up to date.
-- Idempotent: safe to run on prod where the row was already updated manually.

update whatsapp_configs
set twilio_phone_number = '+447935238972'
where twilio_phone_number in ('+447448682282', 'whatsapp:+447448682282');

update businesses
set phone = '+447935238972'
where phone in ('+447448682282', '07448682282');
