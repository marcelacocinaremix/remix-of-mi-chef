-- Drop the problematic policy that creates logical conflicts
DROP POLICY IF EXISTS "Deny anonymous profile access" ON public.profiles;

-- Recreate cleaner RLS policies for profiles table
-- First drop and recreate all policies to ensure clean state
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "No profile deletes" ON public.profiles;

-- Create proper RLS policies that are clear and non-conflicting
-- Only authenticated users can view their own profile
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

-- Only authenticated users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Only authenticated users can update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- No one can delete profiles (they're tied to auth.users)
CREATE POLICY "Profiles cannot be deleted" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (false);