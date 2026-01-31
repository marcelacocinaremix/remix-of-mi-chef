-- Harden RLS on profiles table: ensure no anonymous access and keep access strictly owner-scoped

-- Ensure RLS is enabled (safe if already enabled)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid accidental broad access
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;

-- Also drop any prior deny/legacy policies if present
DROP POLICY IF EXISTS "Deny anonymous profile access" ON public.profiles;
DROP POLICY IF EXISTS "No anonymous profile reads" ON public.profiles;
DROP POLICY IF EXISTS "No anonymous profile writes" ON public.profiles;

-- Authenticated users can only read their own profile
CREATE POLICY "Authenticated users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Authenticated users can create their own profile row only
CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Authenticated users can update their own profile only
CREATE POLICY "Authenticated users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Explicitly deny all anonymous access (defense-in-depth)
CREATE POLICY "Deny anonymous profile access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- (Optional but explicit) deny deletes for authenticated users (profiles are managed by app lifecycle)
CREATE POLICY "No profile deletes"
ON public.profiles
FOR DELETE
TO authenticated
USING (false);
