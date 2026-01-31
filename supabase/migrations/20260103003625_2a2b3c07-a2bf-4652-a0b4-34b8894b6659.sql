-- Drop existing policies on payments table and recreate with explicit anon denial
DROP POLICY IF EXISTS "No user deletes on payments" ON public.payments;
DROP POLICY IF EXISTS "No user inserts on payments" ON public.payments;
DROP POLICY IF EXISTS "No user updates on payments" ON public.payments;
DROP POLICY IF EXISTS "Only service role can read payments" ON public.payments;

-- Block all access for anonymous users (explicit denial)
CREATE POLICY "Deny anonymous SELECT on payments"
ON public.payments
FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous INSERT on payments"
ON public.payments
FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous UPDATE on payments"
ON public.payments
FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous DELETE on payments"
ON public.payments
FOR DELETE
TO anon
USING (false);

-- Block all access for authenticated users (only service role can access)
CREATE POLICY "Deny authenticated SELECT on payments"
ON public.payments
FOR SELECT
TO authenticated
USING (false);

CREATE POLICY "Deny authenticated INSERT on payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Deny authenticated UPDATE on payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (false);

CREATE POLICY "Deny authenticated DELETE on payments"
ON public.payments
FOR DELETE
TO authenticated
USING (false);