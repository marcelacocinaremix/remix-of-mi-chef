-- Add subscription management columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
ADD COLUMN IF NOT EXISTS subscription_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS subscription_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS plan_type text DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS mp_subscription_id text,
ADD COLUMN IF NOT EXISTS mp_preapproval_id text,
ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT true;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON public.user_subscriptions(subscription_status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end ON public.user_subscriptions(subscription_end);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_mp_id ON public.user_subscriptions(mp_subscription_id);

-- Create a function to check if subscription is active
CREATE OR REPLACE FUNCTION public.is_subscription_active(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT subscription_status, subscription_end, is_premium
  INTO sub_record
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if premium and subscription hasn't expired
  IF sub_record.is_premium = true AND 
     (sub_record.subscription_end IS NULL OR sub_record.subscription_end > now()) AND
     sub_record.subscription_status IN ('active', 'authorized', 'trial') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to start a trial
CREATE OR REPLACE FUNCTION public.start_trial(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  existing_sub RECORD;
BEGIN
  -- Check if user already used trial
  SELECT trial_used, subscription_status INTO existing_sub
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  IF FOUND AND existing_sub.trial_used = true THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ya usaste tu período de prueba gratuito'
    );
  END IF;
  
  -- Create or update subscription with trial
  INSERT INTO public.user_subscriptions (
    user_id, 
    is_premium, 
    subscription_start, 
    subscription_end, 
    plan_type,
    subscription_status,
    trial_used
  )
  VALUES (
    p_user_id,
    true,
    now(),
    now() + interval '7 days',
    'trial',
    'trial',
    true
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    is_premium = true,
    subscription_start = now(),
    subscription_end = now() + interval '7 days',
    plan_type = 'trial',
    subscription_status = 'trial',
    trial_used = true,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'message', '¡Tu prueba de 7 días ha comenzado!',
    'trial_end', (now() + interval '7 days')::text
  );
END;
$$;

-- Function to check and expire subscriptions
CREATE OR REPLACE FUNCTION public.check_subscription_expiry(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('is_active', false, 'status', 'none');
  END IF;
  
  -- Check if subscription has expired
  IF sub_record.subscription_end IS NOT NULL AND sub_record.subscription_end < now() THEN
    -- Mark as expired
    UPDATE public.user_subscriptions
    SET 
      is_premium = false,
      subscription_status = 'expired',
      updated_at = now()
    WHERE user_id = p_user_id;
    
    RETURN jsonb_build_object(
      'is_active', false,
      'status', 'expired',
      'expired_at', sub_record.subscription_end
    );
  END IF;
  
  RETURN jsonb_build_object(
    'is_active', sub_record.is_premium,
    'status', sub_record.subscription_status,
    'plan_type', sub_record.plan_type,
    'ends_at', sub_record.subscription_end,
    'trial_used', sub_record.trial_used
  );
END;
$$;