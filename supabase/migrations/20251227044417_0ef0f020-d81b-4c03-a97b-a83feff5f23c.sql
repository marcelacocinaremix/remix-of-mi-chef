-- Add server-side validation for shared_recipes table

-- 1. Add CHECK constraint to limit JSON size (max 100KB)
ALTER TABLE public.shared_recipes
ADD CONSTRAINT recipe_data_size_limit CHECK (
  octet_length(recipe_data::text) <= 102400
);

-- 2. Add CHECK constraint to validate recipe_data structure has required keys
ALTER TABLE public.shared_recipes
ADD CONSTRAINT recipe_data_structure CHECK (
  recipe_data ? 'name' AND
  recipe_data ? 'ingredients' AND
  recipe_data ? 'steps' AND
  recipe_data ? 'nutrition' AND
  jsonb_typeof(recipe_data->'name') = 'string' AND
  jsonb_typeof(recipe_data->'ingredients') = 'array' AND
  jsonb_typeof(recipe_data->'steps') = 'array' AND
  jsonb_typeof(recipe_data->'nutrition') = 'object'
);

-- 3. Add CHECK constraint for shared_by_name length
ALTER TABLE public.shared_recipes
ADD CONSTRAINT shared_by_name_length CHECK (
  shared_by_name IS NULL OR length(shared_by_name) <= 100
);

-- 4. Add CHECK constraint for recipe_name length
ALTER TABLE public.shared_recipes
ADD CONSTRAINT recipe_name_length CHECK (
  length(recipe_name) <= 200
);