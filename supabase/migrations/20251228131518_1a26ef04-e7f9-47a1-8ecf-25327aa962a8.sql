-- Add explicit policies to deny INSERT, UPDATE, DELETE for regular users
-- Only service role (backend) should be able to write to cached_recipes

-- Deny INSERT for all users (only service role can insert)
CREATE POLICY "Only service role can insert cached recipes" 
ON public.cached_recipes 
FOR INSERT 
WITH CHECK (false);

-- Deny UPDATE for all users (only service role can update)
CREATE POLICY "Only service role can update cached recipes" 
ON public.cached_recipes 
FOR UPDATE 
USING (false);

-- Deny DELETE for all users (only service role can delete)
CREATE POLICY "Only service role can delete cached recipes" 
ON public.cached_recipes 
FOR DELETE 
USING (false);