-- Add an explicit RESTRICTIVE policy to deny all anonymous access to profiles table
-- This provides defense-in-depth even though the authenticated policy already prevents anon access
CREATE POLICY "Deny anonymous profile access"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);