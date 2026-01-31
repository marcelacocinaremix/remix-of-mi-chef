-- Add quantity column to shopping_list_items
ALTER TABLE public.shopping_list_items 
ADD COLUMN quantity integer NOT NULL DEFAULT 1;

-- Add unit column for flexibility (unidad, kg, g, litros, etc)
ALTER TABLE public.shopping_list_items 
ADD COLUMN unit text DEFAULT 'unidad';