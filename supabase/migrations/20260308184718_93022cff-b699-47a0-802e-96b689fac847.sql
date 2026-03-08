
-- 1. Fix initialize_user_trial: set trial_used = true from the start
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
    trial_start_date = COALESCE(user_subscriptions.trial_start_date, now()),
    trial_end_date   = COALESCE(user_subscriptions.trial_end_date, now() + interval '15 days'),
    trial_used       = true,
    updated_at       = now();
  
  RETURN NEW;
END;
$function$;

-- 2. Back-fill existing users: mark as trial_used = true if they have a trial_end_date
UPDATE public.user_subscriptions
SET trial_used = true
WHERE trial_end_date IS NOT NULL
  AND (trial_used IS NULL OR trial_used = false);

-- 3. Re-create the trigger on auth.users (guards against missing trigger)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_trial();

-- 4. Re-create handle_new_user trigger for profiles
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
