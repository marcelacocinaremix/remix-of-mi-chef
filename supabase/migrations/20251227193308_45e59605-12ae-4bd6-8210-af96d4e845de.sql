-- Drop the redundant "Deny anonymous profile access" policy
-- The "Authenticated users can view only their own profile" policy already prevents anonymous access
-- because auth.uid() returns NULL for anonymous users, which won't match any id
DROP POLICY IF EXISTS "Deny anonymous profile access" ON public.profiles;

-- Make the authenticated users policy PERMISSIVE (not restrictive) for proper access control
DROP POLICY IF EXISTS "Authenticated users can view only their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);