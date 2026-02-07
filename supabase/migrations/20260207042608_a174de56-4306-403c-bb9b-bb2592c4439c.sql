-- Drop the existing view and recreate it with security_invoker = true
-- This ensures that direct queries to the view will respect RLS on the underlying table
DROP VIEW IF EXISTS public.shared_recipes_public;

-- Recreate the view with security_invoker = true
-- This means direct queries will use the caller's permissions (blocked by RLS)
-- But the get_shared_recipe_by_code function (SECURITY DEFINER) will still work
CREATE VIEW public.shared_recipes_public 
WITH (security_invoker = true)
AS
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

-- Add a comment explaining the security model
COMMENT ON VIEW public.shared_recipes_public IS 'Public view for shared recipes. Direct access is blocked by RLS on shared_recipes table. Use get_shared_recipe_by_code() function for legitimate access via share codes.';