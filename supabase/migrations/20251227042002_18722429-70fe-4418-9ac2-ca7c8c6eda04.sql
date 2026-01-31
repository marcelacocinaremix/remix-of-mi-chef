-- Fix shared_recipes: Add user_id for ownership and DELETE policy

-- Add user_id column to track who shared the recipe
ALTER TABLE public.shared_recipes 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create DELETE policy so users can delete their own shared recipes
CREATE POLICY "Users can delete their own shared recipes"
ON public.shared_recipes
FOR DELETE
USING (auth.uid() = user_id);

-- Create UPDATE policy so users can update their own shared recipes
CREATE POLICY "Users can update their own shared recipes"
ON public.shared_recipes
FOR UPDATE
USING (auth.uid() = user_id);