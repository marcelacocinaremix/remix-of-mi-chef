-- Drop the security definer view as it bypasses RLS
DROP VIEW IF EXISTS public.public_profiles;

-- The function get_public_profile is safe because it only returns public fields
-- and doesn't expose the full profiles table