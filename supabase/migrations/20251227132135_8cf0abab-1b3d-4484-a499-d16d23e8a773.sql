-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a more explicit policy that requires authentication AND ownership
CREATE POLICY "Authenticated users can view only their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Explicitly deny anonymous access (belt and suspenders approach)
CREATE POLICY "Deny anonymous profile access" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);