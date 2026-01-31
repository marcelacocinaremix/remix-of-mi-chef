-- Add quantity and unit columns to pantry_items
ALTER TABLE public.pantry_items 
ADD COLUMN IF NOT EXISTS quantity integer NOT NULL DEFAULT 1;

ALTER TABLE public.pantry_items 
ADD COLUMN IF NOT EXISTS unit text DEFAULT 'unidad';