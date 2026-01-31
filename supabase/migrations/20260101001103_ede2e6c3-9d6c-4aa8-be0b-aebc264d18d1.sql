-- Add explicit policy to block anonymous SELECT on payments table
CREATE POLICY "Block anonymous SELECT on payments"
ON public.payments
FOR SELECT
TO anon
USING (false);

-- Add explicit policy to block anonymous SELECT on user_subscriptions table  
CREATE POLICY "Block anonymous SELECT on user_subscriptions"
ON public.user_subscriptions
FOR SELECT
TO anon
USING (false);