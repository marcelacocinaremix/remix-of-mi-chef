-- Add explicit DENY policy for anonymous users on profiles
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon
USING (false);

-- Add explicit DENY policy for anonymous users on payments
CREATE POLICY "Deny anonymous access to payments" 
ON public.payments 
FOR SELECT 
TO anon
USING (false);