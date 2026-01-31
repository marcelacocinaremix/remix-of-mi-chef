-- Drop the problematic "Deny anonymous profile access" policy that uses ALL command
DROP POLICY IF EXISTS "Deny anonymous profile access" ON public.profiles;

-- Create explicit policies to deny anonymous access for each operation
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
USING (false);

CREATE POLICY "Deny anonymous DELETE on profiles"
ON public.profiles
FOR DELETE
TO anon
USING (false);