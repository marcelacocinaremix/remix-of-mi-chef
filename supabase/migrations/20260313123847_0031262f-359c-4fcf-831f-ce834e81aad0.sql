
-- ============================================================
-- FIX 1: Correct start_trial RPC to use trial_end_date (15 days)
-- ============================================================
CREATE OR REPLACE FUNCTION public.start_trial(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_sub RECORD;
BEGIN
  SELECT trial_used, trial_end_date INTO existing_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  IF FOUND AND existing_sub.trial_used = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_active', true,
      'message', 'Tu prueba de 15 días ya está activa',
      'trial_end', existing_sub.trial_end_date::text
    );
  END IF;

  INSERT INTO public.user_subscriptions (
    user_id,
    is_premium,
    plan_type,
    subscription_status,
    trial_start_date,
    trial_end_date,
    trial_used
  )
  VALUES (
    p_user_id,
    false,
    'free',
    'trial',
    now(),
    now() + interval '15 days',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    is_premium          = false,
    plan_type           = 'free',
    subscription_status = 'trial',
    trial_start_date    = COALESCE(user_subscriptions.trial_start_date, now()),
    trial_end_date      = COALESCE(user_subscriptions.trial_end_date, now() + interval '15 days'),
    trial_used          = true,
    updated_at          = now();

  RETURN jsonb_build_object(
    'success', true,
    'message', '¡Tu prueba de 15 días ha comenzado!',
    'trial_end', (now() + interval '15 days')::text
  );
END;
$function$;

-- ============================================================
-- FIX 2: Fix initialize_user_trial trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION public.initialize_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_subscriptions (
    user_id,
    plan_type,
    is_premium,
    subscription_status,
    trial_start_date,
    trial_end_date,
    trial_used
  )
  VALUES (
    NEW.id,
    'free',
    false,
    'trial',
    now(),
    now() + interval '15 days',
    true
  )
  ON CONFLICT (user_id) DO UPDATE SET
    trial_start_date    = COALESCE(user_subscriptions.trial_start_date, now()),
    trial_end_date      = COALESCE(user_subscriptions.trial_end_date, now() + interval '15 days'),
    trial_used          = true,
    subscription_status = COALESCE(user_subscriptions.subscription_status, 'trial'),
    updated_at          = now();

  RETURN NEW;
END;
$function$;

-- ============================================================
-- FIX 3: Create trigger on profiles so every new user gets trial
-- ============================================================
DROP TRIGGER IF EXISTS on_profile_created_init_trial ON public.profiles;

CREATE TRIGGER on_profile_created_init_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_trial();

-- ============================================================
-- FIX 4: Improve has_active_access to require trial_used=true
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_active_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
      )
    )
  );
$function$;

-- ============================================================
-- FIX 5: Clean up expired trial statuses
-- ============================================================
UPDATE public.user_subscriptions
SET
  subscription_status = 'expired',
  updated_at = now()
WHERE
  trial_used = true
  AND trial_end_date IS NOT NULL
  AND trial_end_date < now()
  AND is_premium = false
  AND subscription_status = 'trial';
