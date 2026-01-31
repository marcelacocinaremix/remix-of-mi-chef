-- Add explicit denial policies for anonymous users on profiles table
-- This provides defense-in-depth security

CREATE POLICY "Deny anonymous SELECT on profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous INSERT on profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous UPDATE on profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny anonymous DELETE on profiles"
ON public.profiles
FOR DELETE
TO anon
USING (false);