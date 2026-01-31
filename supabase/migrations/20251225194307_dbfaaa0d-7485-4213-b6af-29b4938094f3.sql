-- Create table for shared recipes (public access for viral sharing)
CREATE TABLE public.shared_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_code TEXT NOT NULL UNIQUE,
  recipe_data JSONB NOT NULL,
  recipe_name TEXT NOT NULL,
  shared_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days')
);

-- Create index for fast lookup by share_code
CREATE INDEX idx_shared_recipes_share_code ON public.shared_recipes(share_code);

-- Enable RLS
ALTER TABLE public.shared_recipes ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read shared recipes (for viral sharing)
CREATE POLICY "Anyone can view shared recipes"
ON public.shared_recipes
FOR SELECT
USING (true);

-- Allow authenticated users to create shared recipes
CREATE POLICY "Authenticated users can share recipes"
ON public.shared_recipes
FOR INSERT
WITH CHECK (true);