-- Add DELETE policy so users can delete their own profile (GDPR compliance)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = id);

-- Drop the overly restrictive anonymous DELETE deny (the RLS default + auth check is sufficient)
DROP POLICY IF EXISTS "Deny anonymous DELETE on profiles" ON public.profiles;

-- Re-create deny anonymous DELETE to block anon role specifically
CREATE POLICY "Deny anonymous DELETE on profiles"
ON public.profiles
FOR DELETE
TO anon
USING (false);