-- Drop the insecure public view
DROP VIEW IF EXISTS public.shared_recipes_public;

-- Recreate the view with SECURITY INVOKER to respect RLS of the underlying table
-- This view will only be accessible through the get_shared_recipe_by_code function
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
WHERE expires_at IS NULL OR expires_at > now();