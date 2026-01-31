-- Fix critical security issue: Users should NOT be able to insert or update their own subscriptions
-- This should only be done by the backend/service role after payment verification

-- Drop the dangerous INSERT policy
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;

-- Drop the dangerous UPDATE policy  
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;

-- Create restrictive policies that block user modifications
CREATE POLICY "Users cannot insert subscriptions" 
ON public.user_subscriptions 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Users cannot update subscriptions" 
ON public.user_subscriptions 
FOR UPDATE 
USING (false);

-- Revoke write access from anon
REVOKE ALL ON public.user_subscriptions FROM anon;