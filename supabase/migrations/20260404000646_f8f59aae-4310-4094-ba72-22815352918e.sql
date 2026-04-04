-- Fix: Remove the overly permissive SELECT policy on profiles that allows any authenticated user to read ALL profiles.
-- The policy "Deny anonymous SELECT on profiles" uses (auth.uid() IS NOT NULL) which, combined with the proper
-- "Users can view own profile" policy via OR logic, lets any authenticated user see every profile row.

DROP POLICY IF EXISTS "Deny anonymous SELECT on profiles" ON public.profiles;
