-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read cached recipes" ON public.cached_recipes;

-- Create a new policy that requires authentication
CREATE POLICY "Authenticated users can read cached recipes"
ON public.cached_recipes
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);