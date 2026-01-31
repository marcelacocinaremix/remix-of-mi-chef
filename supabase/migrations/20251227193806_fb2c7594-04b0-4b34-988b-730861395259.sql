-- Drop the existing INSERT policy that allows anonymous inserts
DROP POLICY IF EXISTS "Users can share their own recipes" ON public.shared_recipes;

-- Create a new INSERT policy that requires authentication
CREATE POLICY "Users can share their own recipes"
ON public.shared_recipes
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);