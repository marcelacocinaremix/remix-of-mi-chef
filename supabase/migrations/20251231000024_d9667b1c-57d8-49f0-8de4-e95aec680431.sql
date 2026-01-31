-- Add explicit policy to block anonymous access to profiles
-- This is cleaner than blocking ALL commands - specific to anon role only
CREATE POLICY "Block anonymous SELECT on profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Block anonymous INSERT on profiles"
ON public.profiles
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Block anonymous UPDATE on profiles"
ON public.profiles
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Block anonymous DELETE on profiles"
ON public.profiles
FOR DELETE
TO anon
USING (false);