
-- Cache for recipe descriptions (describe-recipe)
CREATE TABLE public.cached_descriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_name text NOT NULL,
  recipe_name_normalized text NOT NULL,
  description text NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cached_descriptions_name ON public.cached_descriptions (recipe_name_normalized);

ALTER TABLE public.cached_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached descriptions" ON public.cached_descriptions FOR SELECT USING (true);
CREATE POLICY "Only service role can insert cached descriptions" ON public.cached_descriptions FOR INSERT WITH CHECK (false);
CREATE POLICY "Only service role can update cached descriptions" ON public.cached_descriptions FOR UPDATE USING (false);
CREATE POLICY "Only service role can delete cached descriptions" ON public.cached_descriptions FOR DELETE USING (false);

-- Cache for marcela reactions (marcela-react)
CREATE TABLE public.cached_marcela_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  reaction_data jsonb NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_cached_marcela_action ON public.cached_marcela_reactions (action);

ALTER TABLE public.cached_marcela_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached reactions" ON public.cached_marcela_reactions FOR SELECT USING (true);
CREATE POLICY "Only service role can insert cached reactions" ON public.cached_marcela_reactions FOR INSERT WITH CHECK (false);
CREATE POLICY "Only service role can update cached reactions" ON public.cached_marcela_reactions FOR UPDATE USING (false);
CREATE POLICY "Only service role can delete cached reactions" ON public.cached_marcela_reactions FOR DELETE USING (false);
