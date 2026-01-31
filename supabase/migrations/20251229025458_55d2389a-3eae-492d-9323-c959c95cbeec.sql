-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create a stronger policy that explicitly targets only authenticated users
CREATE POLICY "Authenticated users can only view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);