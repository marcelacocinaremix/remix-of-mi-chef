
-- ============================================================
-- SUBSCRIPTION STATE MACHINE FIX
-- ============================================================

-- 1. Fix plan_type inconsistency: users in trial should have plan_type='trial'
UPDATE public.user_subscriptions
SET plan_type = 'trial', updated_at = now()
WHERE subscription_status = 'trial'
  AND plan_type = 'free'
  AND trial_used = true
  AND trial_end_date > now();

-- 2. Auto-expire trials that have passed their trial_end_date
UPDATE public.user_subscriptions
SET 
  subscription_status = 'expired',
  plan_type = 'free',
  updated_at = now()
WHERE subscription_status = 'trial'
  AND trial_used = true
  AND trial_end_date IS NOT NULL
  AND trial_end_date <= now()
  AND is_premium = false;

-- 3. Auto-expire paid subscriptions that have passed their subscription_end
UPDATE public.user_subscriptions
SET 
  is_premium = false,
  subscription_status = 'expired',
  updated_at = now()
WHERE is_premium = true
  AND subscription_end IS NOT NULL
  AND subscription_end <= now()
  AND subscription_status NOT IN ('pending');

-- 4. Fix cancelled subscriptions whose subscription_end has passed
UPDATE public.user_subscriptions
SET 
  is_premium = false,
  subscription_status = 'expired',
  updated_at = now()
WHERE subscription_status = 'cancelled'
  AND is_premium = true
  AND subscription_end IS NOT NULL
  AND subscription_end <= now();

-- ============================================================
-- Improved has_active_access
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
      (
        is_premium = true
        AND (subscription_end IS NULL OR subscription_end > now())
      )
      OR
      (
        trial_used = true
        AND trial_end_date IS NOT NULL
        AND trial_end_date > now()
        AND is_premium = false
      )
    )
  );
$$;

-- ============================================================
-- Trigger: auto-expire subscriptions on write
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_expire_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Expire trial if past end date
  IF NEW.is_premium = false
     AND NEW.trial_used = true
     AND NEW.trial_end_date IS NOT NULL
     AND NEW.trial_end_date <= now()
     AND NEW.subscription_status = 'trial' THEN
    NEW.subscription_status := 'expired';
    NEW.plan_type := 'free';
    NEW.updated_at := now();
  END IF;

  -- Expire active paid subscription if past end date
  IF NEW.is_premium = true
     AND NEW.subscription_end IS NOT NULL
     AND NEW.subscription_end <= now()
     AND NEW.subscription_status NOT IN ('pending', 'expired') THEN
    NEW.is_premium := false;
    NEW.subscription_status := 'expired';
    NEW.updated_at := now();
  END IF;

  -- Expire cancelled subscription if past end date
  IF NEW.subscription_status = 'cancelled'
     AND NEW.is_premium = true
     AND NEW.subscription_end IS NOT NULL
     AND NEW.subscription_end <= now() THEN
    NEW.is_premium := false;
    NEW.subscription_status := 'expired';
    NEW.updated_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_expire_subscription ON public.user_subscriptions;
CREATE TRIGGER trg_auto_expire_subscription
BEFORE INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.auto_expire_subscription();
