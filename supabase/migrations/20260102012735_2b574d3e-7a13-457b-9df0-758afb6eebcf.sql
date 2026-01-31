-- Drop existing SELECT policies on payments table
DROP POLICY IF EXISTS "Authenticated users can only view own payments" ON public.payments;
DROP POLICY IF EXISTS "Block anonymous SELECT on payments" ON public.payments;

-- Create a single restrictive policy that blocks ALL client access
-- Only service role (edge functions) can access this table
CREATE POLICY "Only service role can read payments" 
ON public.payments 
FOR SELECT 
USING (false);

-- Add comment explaining the security model
COMMENT ON TABLE public.payments IS 'Payment records - ALL access restricted to service role (edge functions) only for security. No client queries allowed.';