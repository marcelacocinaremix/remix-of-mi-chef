-- Drop all existing policies on payments table
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Prevent user inserts on payments" ON public.payments;
DROP POLICY IF EXISTS "Prevent user updates on payments" ON public.payments;
DROP POLICY IF EXISTS "Prevent user deletes on payments" ON public.payments;
DROP POLICY IF EXISTS "Deny anonymous payment access" ON public.payments;

-- Create clean, explicit policies
-- Authenticated users can only view their own payments
CREATE POLICY "Authenticated users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Prevent all user modifications (payments are managed by edge functions with service role)
CREATE POLICY "No user inserts on payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No user updates on payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "No user deletes on payments"
ON public.payments
FOR DELETE
TO authenticated
USING (false);