
-- Cache for nutrition estimates (avoid AI calls for same foods)
CREATE TABLE public.cached_nutrition (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name text NOT NULL,
  food_name_normalized text NOT NULL,
  portion text,
  calories integer NOT NULL DEFAULT 0,
  protein integer NOT NULL DEFAULT 0,
  carbs integer NOT NULL DEFAULT 0,
  fats integer NOT NULL DEFAULT 0,
  portion_description text,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create unique index on normalized name + portion
CREATE UNIQUE INDEX idx_cached_nutrition_lookup ON public.cached_nutrition (food_name_normalized, COALESCE(portion, ''));

-- Enable RLS
ALTER TABLE public.cached_nutrition ENABLE ROW LEVEL SECURITY;

-- Public read (cached data is not user-specific)
CREATE POLICY "Anyone can read cached nutrition" ON public.cached_nutrition FOR SELECT USING (true);
CREATE POLICY "Only service role can insert cached nutrition" ON public.cached_nutrition FOR INSERT WITH CHECK (false);
CREATE POLICY "Only service role can update cached nutrition" ON public.cached_nutrition FOR UPDATE USING (false);
CREATE POLICY "Only service role can delete cached nutrition" ON public.cached_nutrition FOR DELETE USING (false);

-- Cache for food guide tips (food + category combos)
CREATE TABLE public.cached_food_guides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  food_name text NOT NULL,
  food_name_normalized text NOT NULL,
  category text NOT NULL,
  response_data jsonb NOT NULL,
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cached_food_guides_lookup ON public.cached_food_guides (food_name_normalized, category);

ALTER TABLE public.cached_food_guides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached food guides" ON public.cached_food_guides FOR SELECT USING (true);
CREATE POLICY "Only service role can insert cached food guides" ON public.cached_food_guides FOR INSERT WITH CHECK (false);
CREATE POLICY "Only service role can update cached food guides" ON public.cached_food_guides FOR UPDATE USING (false);
CREATE POLICY "Only service role can delete cached food guides" ON public.cached_food_guides FOR DELETE USING (false);

-- Cache for smart tips (reusable tips pool)
CREATE TABLE public.cached_smart_tips (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tip text NOT NULL,
  context_type text NOT NULL DEFAULT 'general',
  usage_count integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cached_smart_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached smart tips" ON public.cached_smart_tips FOR SELECT USING (true);
CREATE POLICY "Only service role can insert cached smart tips" ON public.cached_smart_tips FOR INSERT WITH CHECK (false);
CREATE POLICY "Only service role can delete cached smart tips" ON public.cached_smart_tips FOR DELETE USING (false);
