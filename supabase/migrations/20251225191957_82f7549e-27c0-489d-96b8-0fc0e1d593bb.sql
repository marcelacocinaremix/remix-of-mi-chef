-- Add language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN language TEXT DEFAULT 'es';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.language IS 'User preferred language: es, en, pt';