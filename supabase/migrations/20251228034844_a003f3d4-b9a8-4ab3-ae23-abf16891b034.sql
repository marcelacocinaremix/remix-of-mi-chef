-- Remove the problematic public access policy
-- The function get_shared_recipe_by_code (SECURITY DEFINER) already handles public access by share_code
DROP POLICY IF EXISTS "Anyone can view shared recipes by share_code" ON public.shared_recipes;

-- Ensure users can still view their own shared recipes (this policy already exists but let's be sure)
DROP POLICY IF EXISTS "Users can view their own shared recipes" ON public.shared_recipes;

CREATE POLICY "Users can view their own shared recipes" 
ON public.shared_recipes 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);