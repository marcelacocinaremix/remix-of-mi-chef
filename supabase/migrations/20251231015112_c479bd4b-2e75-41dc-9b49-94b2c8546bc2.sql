-- Create table for scanned products with nutritional info
CREATE TABLE public.scanned_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  brand TEXT,
  serving_size TEXT,
  calories NUMERIC,
  total_fat NUMERIC,
  saturated_fat NUMERIC,
  trans_fat NUMERIC,
  cholesterol NUMERIC,
  sodium NUMERIC,
  total_carbs NUMERIC,
  dietary_fiber NUMERIC,
  sugars NUMERIC,
  protein NUMERIC,
  raw_text TEXT,
  image_url TEXT,
  added_to_pantry BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scanned_products ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own scanned products"
ON public.scanned_products
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scanned products"
ON public.scanned_products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scanned products"
ON public.scanned_products
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned products"
ON public.scanned_products
FOR DELETE
USING (auth.uid() = user_id);

-- Add source column to pantry_items to differentiate manual vs scanned
ALTER TABLE public.pantry_items 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS scanned_product_id UUID REFERENCES public.scanned_products(id) ON DELETE SET NULL;