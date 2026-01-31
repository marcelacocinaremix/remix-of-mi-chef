-- Add UPDATE policy for pantry_items table
CREATE POLICY "Users can update their own pantry items"
ON public.pantry_items FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);