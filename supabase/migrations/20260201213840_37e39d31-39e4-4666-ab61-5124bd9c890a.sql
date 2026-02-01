-- Create table for favorite food tips
CREATE TABLE public.favorite_food_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  food_name TEXT NOT NULL,
  category TEXT NOT NULL,
  tip_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.favorite_food_tips ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own favorite food tips" 
ON public.favorite_food_tips 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorite food tips" 
ON public.favorite_food_tips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorite food tips" 
ON public.favorite_food_tips 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_favorite_food_tips_user_id ON public.favorite_food_tips(user_id);