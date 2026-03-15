-- ============================================================
-- 1. Backfill profiles for users that don't have one
-- ============================================================
INSERT INTO public.profiles (id, display_name, updated_at)
SELECT 
  au.id,
  COALESCE(
    au.raw_user_meta_data->>'display_name',
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    split_part(au.email, '@', 1)
  ),
  now()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Backfill subscriptions (with 15-day trial from signup date) for users without one
-- ============================================================
INSERT INTO public.user_subscriptions (
  user_id,
  plan_type,
  is_premium,
  subscription_status,
  trial_start_date,
  trial_end_date,
  trial_used
)
SELECT 
  au.id,
  'free',
  false,
  CASE 
    WHEN (au.created_at + interval '15 days') > now() THEN 'trial'
    ELSE 'expired'
  END,
  au.created_at,
  au.created_at + interval '15 days',
  true
FROM auth.users au
LEFT JOIN public.user_subscriptions us ON us.user_id = au.id
WHERE us.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- 3. Fix duplicate trigger on auth.users (two triggers calling initialize_user_trial)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================================
-- 4. Improve handle_new_user to also save avatar_url and country
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, country)
  VALUES (
    new.id,
    COALESCE(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'country'
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    avatar_url   = COALESCE(EXCLUDED.avatar_url,   profiles.avatar_url),
    updated_at   = now();
  RETURN new;
END;
$$;

-- ============================================================
-- 5. Make initialize_user_trial safe: never overwrite existing subscription
-- ============================================================
CREATE OR REPLACE FUNCTION public.initialize_user_trial()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- 6. Remove redundant profile-level trigger (subscription init handled on auth.users)
-- ============================================================
DROP TRIGGER IF EXISTS on_profile_created_init_trial ON public.profiles;
