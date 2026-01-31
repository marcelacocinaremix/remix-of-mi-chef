-- Fix 1: Update increment_recipe_uses to use auth.uid() internally instead of accepting user_id parameter
CREATE OR REPLACE FUNCTION public.increment_recipe_uses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count INTEGER;
  calling_user_id UUID;
BEGIN
  -- Get the authenticated user
  calling_user_id := auth.uid();
  
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  INSERT INTO public.user_subscriptions (user_id, recipe_uses)
  VALUES (calling_user_id, 1)
  ON CONFLICT (user_id)
  DO UPDATE SET 
    recipe_uses = user_subscriptions.recipe_uses + 1,
    updated_at = now()
  RETURNING recipe_uses INTO new_count;
  
  RETURN new_count;
END;
$$;

-- Fix 2: Add explicit DENY policies for payments table
-- Prevent users from inserting payments directly
CREATE POLICY "Prevent user inserts on payments"
ON public.payments FOR INSERT
WITH CHECK (false);

-- Prevent users from updating payments directly
CREATE POLICY "Prevent user updates on payments"
ON public.payments FOR UPDATE
USING (false);

-- Prevent users from deleting payments directly
CREATE POLICY "Prevent user deletes on payments"
ON public.payments FOR DELETE
USING (false);