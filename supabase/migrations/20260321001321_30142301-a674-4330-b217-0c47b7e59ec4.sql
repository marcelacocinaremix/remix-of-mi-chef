-- Fix auto_expire_subscription trigger to NOT expire if auto_renew = true
-- This is the ROOT CAUSE: trigger was overwriting is_premium=false even when autoRenewing=true in Google Play
CREATE OR REPLACE FUNCTION public.auto_expire_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- CRITICAL FIX: Only expire ACTIVE subscription if auto_renew is NOT true
  -- When auto_renew=true, Google Play is actively renewing — do NOT expire locally
  IF NEW.is_premium = true
     AND NEW.subscription_end IS NOT NULL
     AND NEW.subscription_end <= now()
     AND NEW.subscription_status = 'active'
     AND (NEW.auto_renew IS NULL OR NEW.auto_renew = false) THEN
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

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS auto_expire_subscription_trigger ON public.user_subscriptions;
CREATE TRIGGER auto_expire_subscription_trigger
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_expire_subscription();