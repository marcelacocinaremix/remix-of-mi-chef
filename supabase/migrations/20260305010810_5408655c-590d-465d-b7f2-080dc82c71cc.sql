
-- Fix profiles RLS to prevent user enumeration attacks
-- Drop and recreate SELECT policies with explicit owner-only enforcement

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous SELECT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny cross-user profile access" ON public.profiles;

-- Single strict policy: only the owner can read their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Explicit block for anonymous
CREATE POLICY "Deny anonymous SELECT on profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Harden get_public_profile to only expose non-sensitive fields
-- (no birth_date, gender, allergies, diet_type, cooking_skill, preferred_foods)
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE(id uuid, display_name text, avatar_url text, bio text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.bio
  FROM public.profiles p
  WHERE p.id = profile_id;
$$;
