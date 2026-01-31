-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view own payments" ON public.payments;

-- Create a more explicit policy that blocks anonymous access
CREATE POLICY "Block anonymous and allow own payments only" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
