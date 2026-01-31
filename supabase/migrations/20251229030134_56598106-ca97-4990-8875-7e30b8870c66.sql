-- Drop existing policies
DROP POLICY IF EXISTS "Block anonymous and allow own payments only" ON public.payments;
DROP POLICY IF EXISTS "No user deletes on payments" ON public.payments;
DROP POLICY IF EXISTS "No user inserts on payments" ON public.payments;
DROP POLICY IF EXISTS "No user updates on payments" ON public.payments;

-- Recreate policies with explicit TO authenticated
CREATE POLICY "Authenticated users can only view own payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

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