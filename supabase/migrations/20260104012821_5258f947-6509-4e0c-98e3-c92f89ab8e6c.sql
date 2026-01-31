-- Add expiration_date column to pantry_items table
ALTER TABLE public.pantry_items 
ADD COLUMN IF NOT EXISTS expiration_date date DEFAULT NULL;

-- Add notification_sent column to track if user was notified
ALTER TABLE public.pantry_items 
ADD COLUMN IF NOT EXISTS expiration_notified boolean DEFAULT false;