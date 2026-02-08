-- Add explicit denial policies for anonymous access to scanned_products table
-- This prevents any anonymous user from accessing sensitive health/nutrition data

CREATE POLICY "Deny anonymous SELECT on scanned_products"
ON public.scanned_products FOR SELECT
TO anon
USING (false);

CREATE POLICY "Deny anonymous INSERT on scanned_products"
ON public.scanned_products FOR INSERT
TO anon
WITH CHECK (false);

CREATE POLICY "Deny anonymous UPDATE on scanned_products"
ON public.scanned_products FOR UPDATE
TO anon
USING (false);

CREATE POLICY "Deny anonymous DELETE on scanned_products"
ON public.scanned_products FOR DELETE
TO anon
USING (false);