-- Drop the conflicting/redundant "Block anonymous access" policy
-- The existing policies already prevent anonymous access since auth.uid() returns NULL for anonymous users
DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;