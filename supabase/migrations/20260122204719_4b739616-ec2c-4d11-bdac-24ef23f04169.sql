-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_shared_recipe_by_code(text);

-- Drop the existing public SELECT policy that exposes user_id
DROP POLICY IF EXISTS "Anyone can view shared recipes by share code" ON public.shared_recipes;

-- Create a more restrictive policy - only owners can select from base table
CREATE POLICY "Only owners can view shared recipes directly"
ON public.shared_recipes
FOR SELECT
USING (auth.uid() = user_id);

-- Create a public view that excludes user_id for anonymous access
CREATE VIEW public.shared_recipes_public
WITH (security_invoker = on) AS
SELECT 
  id,
  share_code,
  recipe_name,
  recipe_data,
  shared_by_name,
  created_at,
  expires_at
FROM public.shared_recipes
WHERE (expires_at IS NULL OR expires_at > now());

-- Recreate the function WITHOUT user_id in the return type
CREATE OR REPLACE FUNCTION public.get_shared_recipe_by_code(p_share_code text)
RETURNS TABLE(id uuid, share_code text, recipe_name text, recipe_data jsonb, shared_by_name text, created_at timestamp with time zone, expires_at timestamp with time zone)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    id,
    share_code,
    recipe_name,
    recipe_data,
    shared_by_name,
    created_at,
    expires_at
  FROM public.shared_recipes
  WHERE share_code = p_share_code
  AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;