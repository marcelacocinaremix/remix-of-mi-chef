-- Drop the insecure public view
-- The secure function get_shared_recipe_by_code already handles public access properly
DROP VIEW IF EXISTS public.shared_recipes_public;