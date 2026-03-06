-- ============================================================
-- Migration: Auto-create business + user_businesses on signup
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- Ensure required columns exist on businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_type TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'solo';

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_business_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _meta jsonb;
  _role text;
  _business_name text;
  _slug text;
  _base_slug text;
  _email text;
  _phone text;
  _business_type text;
  _plan text;
  _owner_name text;
  _business_id uuid;
  _slug_suffix int := 0;
  _slug_exists boolean;
BEGIN
  _meta := NEW.raw_user_meta_data;

  -- Only process business owner signups
  _role := _meta->>'role';
  IF _role IS NULL OR _role != 'business_owner' THEN
    RETURN NEW;
  END IF;

  -- Extract metadata
  _business_name := _meta->>'business_name';
  _slug := _meta->>'business_slug';
  _email := NEW.email;
  _phone := _meta->>'phone';
  _business_type := _meta->>'business_type';
  _plan := COALESCE(_meta->>'plan', 'solo');
  _owner_name := _meta->>'full_name';

  -- Bail if no business name provided
  IF _business_name IS NULL OR _business_name = '' THEN
    RETURN NEW;
  END IF;

  -- Generate slug if not provided
  IF _slug IS NULL OR _slug = '' THEN
    _slug := lower(regexp_replace(regexp_replace(_business_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
  END IF;

  _base_slug := _slug;

  -- Handle slug uniqueness: append -1, -2, etc.
  LOOP
    SELECT EXISTS(SELECT 1 FROM businesses WHERE slug = _slug) INTO _slug_exists;
    EXIT WHEN NOT _slug_exists;
    _slug_suffix := _slug_suffix + 1;
    _slug := _base_slug || '-' || _slug_suffix;
  END LOOP;

  -- Create the business record
  INSERT INTO businesses (
    slug,
    name,
    owner_email,
    phone,
    business_type,
    subscription_tier,
    is_active,
    trial_ends_at,
    created_at
  ) VALUES (
    _slug,
    _business_name,
    _email,
    _phone,
    _business_type,
    _plan,
    true,
    now() + interval '30 days',
    now()
  )
  RETURNING id INTO _business_id;

  -- Link user to business
  INSERT INTO user_businesses (user_id, business_id, role)
  VALUES (NEW.id, _business_id, 'owner');

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'handle_new_business_owner failed: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger (drop first if exists to allow re-running)
DROP TRIGGER IF EXISTS on_auth_user_created_business ON auth.users;

CREATE TRIGGER on_auth_user_created_business
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_business_owner();
