-- Drop all existing policies on profiles table to start clean
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can only view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous DELETE on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous INSERT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous SELECT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous UPDATE on profiles" ON public.profiles;
DROP POLICY IF EXISTS "No profile deletions allowed" ON public.profiles;

-- Create clean, simple PERMISSIVE policies for authenticated users only
-- These automatically block anonymous users because auth.uid() returns null for them

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No delete policy = users cannot delete their profiles