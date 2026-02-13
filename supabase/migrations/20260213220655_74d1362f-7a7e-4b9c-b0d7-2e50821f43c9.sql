
-- Add trial columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS trial_start_date timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_end_date timestamp with time zone DEFAULT NULL;

-- Create function to auto-initialize trial on profile creation
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
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    trial_start_date = COALESCE(user_subscriptions.trial_start_date, now()),
    trial_end_date = COALESCE(user_subscriptions.trial_end_date, now() + interval '15 days'),
    updated_at = now();
  
  RETURN NEW;
END;
$function$;

-- Create trigger on profiles table (fires after handle_new_user creates the profile)
DROP TRIGGER IF EXISTS on_profile_created_init_trial ON public.profiles;
CREATE TRIGGER on_profile_created_init_trial
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.initialize_user_trial();

-- Backfill existing users who don't have trial dates
UPDATE public.user_subscriptions
SET 
  trial_start_date = COALESCE(trial_start_date, created_at),
  trial_end_date = COALESCE(trial_end_date, created_at + interval '15 days'),
  plan_type = COALESCE(plan_type, 'free')
WHERE trial_start_date IS NULL;
