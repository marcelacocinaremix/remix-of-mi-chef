-- Create a public view for safe profile fields only
-- This allows other users to see display_name, avatar_url, bio without exposing sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  id,
  display_name,
  avatar_url,
  bio
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;

-- Create RLS policy on the view to allow reading public fields
-- Note: Views inherit RLS from underlying tables, so we need a security definer function

-- Create a security definer function to get public profile data
CREATE OR REPLACE FUNCTION public.get_public_profile(profile_id uuid)
RETURNS TABLE (
  id uuid,
  display_name text,
  avatar_url text,
  bio text
)
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