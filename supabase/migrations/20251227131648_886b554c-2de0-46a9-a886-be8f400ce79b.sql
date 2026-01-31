-- Drop the insecure INSERT policy
DROP POLICY IF EXISTS "Authenticated users can share recipes" ON public.shared_recipes;

-- Create a secure INSERT policy that validates user ownership
CREATE POLICY "Users can share their own recipes" 
ON public.shared_recipes 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- User must set their own user_id (or null for anonymous shares)
  (user_id IS NULL OR user_id = auth.uid())
  -- shared_by_name must be null (anonymous sharing enforced)
  AND shared_by_name IS NULL
);