-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous SELECT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous INSERT on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous UPDATE on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Deny anonymous DELETE on profiles" ON public.profiles;

-- Create clean, explicit policies for authenticated users only
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);