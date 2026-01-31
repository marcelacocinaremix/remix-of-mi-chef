-- Create table for cooked recipes history
CREATE TABLE public.cooked_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recipe_name TEXT NOT NULL,
  recipe_data JSONB NOT NULL,
  cooked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cooked_recipes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own cooked recipes"
ON public.cooked_recipes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cooked recipes"
ON public.cooked_recipes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cooked recipes"
ON public.cooked_recipes
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_cooked_recipes_user_id ON public.cooked_recipes(user_id);
CREATE INDEX idx_cooked_recipes_cooked_at ON public.cooked_recipes(cooked_at DESC);