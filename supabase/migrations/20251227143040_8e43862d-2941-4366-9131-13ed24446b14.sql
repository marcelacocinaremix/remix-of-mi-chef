-- Add policy to deny anonymous access to payments table
CREATE POLICY "Deny anonymous payment access" 
ON public.payments 
FOR SELECT 
USING (false);
