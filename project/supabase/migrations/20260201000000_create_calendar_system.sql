-- ============================================================================
-- CALENDAR SYSTEM MIGRATION
-- Creates tables for full calendar system: business events, cultural events,
-- delivery slots, and appointments
-- ============================================================================

-- ============================================================================
-- TABLE 1: calendar_events - Main events table
-- ============================================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  -- Core fields
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN (
    'business_event',     -- Sales, promotions, meetings
    'cultural_event',     -- Cultural/religious holidays
    'delivery_slot',      -- Customer delivery time slots
    'appointment',        -- Customer appointments/consultations
    'store_hours'         -- Special store hours (open/close)
  )),

  -- Timing
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  all_day boolean DEFAULT false,
  timezone text DEFAULT 'Europe/London',

  -- Recurrence (RRULE-like format)
  is_recurring boolean DEFAULT false,
  recurrence_rule jsonb,  -- { frequency: 'yearly', interval: 1, days: [], until: null }
  recurrence_parent_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE,

  -- Cultural event specifics
  emoji text,
  expected_increase integer,  -- Percentage demand increase
  communities text[],         -- Target communities
  affected_products text[],   -- Product categories affected
  stock_recommendations jsonb, -- [{ product: 'Rice', extraUnits: 30 }]

  -- Delivery/Appointment specifics
  customer_id uuid,
  customer_name text,
  customer_phone text,
  customer_email text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  status text DEFAULT 'scheduled' CHECK (status IN (
    'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
  )),

  -- Booking specifics (for delivery slots)
  max_bookings integer DEFAULT 1,
  current_bookings integer DEFAULT 0,
  booking_duration_minutes integer DEFAULT 30,

  -- Visual/UI
  color text,
  priority integer DEFAULT 0,  -- 0=low, 1=medium, 2=high
  is_public boolean DEFAULT false,

  -- Notifications
  send_reminder boolean DEFAULT false,
  reminder_minutes integer DEFAULT 60,

  -- Metadata
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TABLE 2: delivery_slot_templates - Reusable delivery slot templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS delivery_slot_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,

  name text NOT NULL,  -- "Morning Delivery", "Afternoon Slot"
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),  -- 0=Sunday
  start_time time NOT NULL,
  end_time time NOT NULL,

  max_bookings integer DEFAULT 5,
  is_active boolean DEFAULT true,

  -- Delivery zones (postcodes)
  zones text[],

  -- Pricing
  delivery_fee numeric(10,2) DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- TABLE 3: event_bookings - Customer bookings for time slots
-- ============================================================================
CREATE TABLE IF NOT EXISTS event_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid REFERENCES businesses(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES calendar_events(id) ON DELETE CASCADE NOT NULL,

  customer_name text NOT NULL,
  customer_phone text,
  customer_email text,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,

  status text DEFAULT 'pending' CHECK (status IN (
    'pending', 'confirmed', 'cancelled', 'completed', 'no_show'
  )),

  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,

  booked_at timestamptz DEFAULT now(),
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- calendar_events indexes
CREATE INDEX IF NOT EXISTS idx_calendar_events_business ON calendar_events(business_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(business_id, event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON calendar_events(business_id, start_datetime, end_datetime);
CREATE INDEX IF NOT EXISTS idx_calendar_events_recurring ON calendar_events(is_recurring) WHERE is_recurring = true;
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);
CREATE INDEX IF NOT EXISTS idx_calendar_events_customer ON calendar_events(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_calendar_events_order ON calendar_events(order_id) WHERE order_id IS NOT NULL;

-- delivery_slot_templates indexes
CREATE INDEX IF NOT EXISTS idx_delivery_slots_business ON delivery_slot_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_day ON delivery_slot_templates(business_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_active ON delivery_slot_templates(business_id, is_active) WHERE is_active = true;

-- event_bookings indexes
CREATE INDEX IF NOT EXISTS idx_event_bookings_business ON event_bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_event ON event_bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_event_bookings_customer ON event_bookings(customer_phone) WHERE customer_phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_bookings_order ON event_bookings(order_id) WHERE order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_event_bookings_status ON event_bookings(business_id, status);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_slot_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_bookings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Following Apinlero's permissive pattern for demo
-- ============================================================================

-- calendar_events policies
CREATE POLICY "Allow public read access to calendar_events" ON calendar_events
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to calendar_events" ON calendar_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to calendar_events" ON calendar_events
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to calendar_events" ON calendar_events
  FOR DELETE USING (true);

-- delivery_slot_templates policies
CREATE POLICY "Allow public read access to delivery_slot_templates" ON delivery_slot_templates
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to delivery_slot_templates" ON delivery_slot_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to delivery_slot_templates" ON delivery_slot_templates
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to delivery_slot_templates" ON delivery_slot_templates
  FOR DELETE USING (true);

-- event_bookings policies
CREATE POLICY "Allow public read access to event_bookings" ON event_bookings
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert access to event_bookings" ON event_bookings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access to event_bookings" ON event_bookings
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow public delete access to event_bookings" ON event_bookings
  FOR DELETE USING (true);

-- ============================================================================
-- TRIGGERS - Auto-update timestamps
-- ============================================================================

CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_delivery_slot_templates_updated_at
  BEFORE UPDATE ON delivery_slot_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_bookings_updated_at
  BEFORE UPDATE ON event_bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'calendar_events') THEN
    RAISE EXCEPTION 'calendar_events table not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'delivery_slot_templates') THEN
    RAISE EXCEPTION 'delivery_slot_templates table not created';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'event_bookings') THEN
    RAISE EXCEPTION 'event_bookings table not created';
  END IF;
  RAISE NOTICE 'Calendar system tables created successfully';
END $$;
