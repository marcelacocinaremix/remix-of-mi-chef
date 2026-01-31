-- Create a secure function to fetch shared recipes by share_code only
CREATE OR REPLACE FUNCTION public.get_shared_recipe_by_code(p_share_code text)
RETURNS TABLE (
  id uuid,
  share_code text,
  recipe_name text,
  recipe_data jsonb,
  shared_by_name text,
  user_id uuid,
  created_at timestamptz,
  expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    id,
    share_code,
    recipe_name,
    recipe_data,
    shared_by_name,
    user_id,
    created_at,
    expires_at
  FROM public.shared_recipes
  WHERE share_code = p_share_code
  AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view shared recipes" ON public.shared_recipes;

-- Create a restricted SELECT policy - only owners can view their own shared recipes directly
-- Public access is now through the RPC function only
CREATE POLICY "Users can view their own shared recipes" 
ON public.shared_recipes 
FOR SELECT 
USING (auth.uid() = user_id);