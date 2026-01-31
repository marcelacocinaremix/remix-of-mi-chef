-- Drop existing SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a more restrictive SELECT policy that:
-- 1. Requires authenticated role (not anon)
-- 2. Requires auth.uid() to not be null
-- 3. Requires the profile id to match the authenticated user
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = id);

-- Ensure anon role cannot access profiles at all
-- This is implicit since we specify TO authenticated, but let's be explicit
REVOKE ALL ON public.profiles FROM anon;