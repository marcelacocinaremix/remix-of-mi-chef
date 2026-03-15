
-- ============================================================
-- FIX 1: has_active_access — prioritize subscription_end over
-- trial expiry; explicitly include 'cancelled' with valid end date
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND (
      -- PRIORITY 1: Active paid subscription (includes cancelled-in-grace-period)
      (
        is_premium = true
        AND (subscription_end IS NULL OR subscription_end > now())
      )
      OR
      -- PRIORITY 2: Active trial (only when no paid period active)
      (
        is_premium = false
        AND trial_used = true
        AND trial_end_date IS NOT NULL
        AND trial_end_date > now()
      )
    )
  );
$$;

-- ============================================================
-- FIX 2: auto_expire_subscription trigger — NEVER expire a
-- cancelled subscription that still has valid subscription_end
-- (that's the grace period — user paid for it)
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_expire_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Expire trial only when past end date AND no paid plan running
  IF NEW.is_premium = false
     AND NEW.trial_used = true
     AND NEW.trial_end_date IS NOT NULL
     AND NEW.trial_end_date <= now()
     AND NEW.subscription_status = 'trial' THEN
    NEW.subscription_status := 'expired';
    NEW.plan_type := 'free';
    NEW.updated_at := now();
  END IF;

  -- Expire ACTIVE paid subscription if past end date
  -- (NOT cancelled — cancelled keeps access until end date)
  IF NEW.is_premium = true
     AND NEW.subscription_end IS NOT NULL
     AND NEW.subscription_end <= now()
     AND NEW.subscription_status = 'active' THEN
    NEW.is_premium := false;
    NEW.subscription_status := 'expired';
    NEW.plan_type := 'free';
    NEW.updated_at := now();
  END IF;

  -- Expire CANCELLED subscription only after end date passes
  IF NEW.subscription_status = 'cancelled'
     AND NEW.is_premium = true
     AND NEW.subscription_end IS NOT NULL
     AND NEW.subscription_end <= now() THEN
    NEW.is_premium := false;
    NEW.subscription_status := 'expired';
    NEW.plan_type := 'free';
    NEW.updated_at := now();
  END IF;

  -- Cancelled + valid end date = KEEP is_premium true (grace period)
  -- Do nothing — this is intentional. User paid until subscription_end.

  RETURN NEW;
END;
$$;

-- ============================================================
-- FIX 3: Re-create the trigger (was missing from db-triggers)
-- ============================================================
DROP TRIGGER IF EXISTS trg_auto_expire_subscription ON public.user_subscriptions;
CREATE TRIGGER trg_auto_expire_subscription
BEFORE INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.auto_expire_subscription();

-- Re-create trigger for handle_new_user on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Re-create trigger for initialize_user_trial on profiles
DROP TRIGGER IF EXISTS on_profile_created_init_trial ON public.profiles;
CREATE TRIGGER on_profile_created_init_trial
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.initialize_user_trial();
