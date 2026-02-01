-- Remove duplicate SELECT policy on shared_recipes
DROP POLICY IF EXISTS "Users can view their own shared recipes" ON public.shared_recipes;