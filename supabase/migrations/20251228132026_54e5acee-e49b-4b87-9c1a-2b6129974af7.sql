-- Update payments policy to be more restrictive
DROP POLICY IF EXISTS "Authenticated users can view own payments" ON public.payments;

CREATE POLICY "Authenticated users can view own payments" 
ON public.payments 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Revoke all access from anon role
REVOKE ALL ON public.payments FROM anon;