
-- Fix shopping_list_items: remove has_write_access restriction (free for all users)
DROP POLICY IF EXISTS "Users can insert their own shopping list items" ON public.shopping_list_items;
DROP POLICY IF EXISTS "Users can update their own shopping list items" ON public.shopping_list_items;
DROP POLICY IF EXISTS "Users can delete their own shopping list items" ON public.shopping_list_items;

CREATE POLICY "Users can insert their own shopping list items"
  ON public.shopping_list_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping list items"
  ON public.shopping_list_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping list items"
  ON public.shopping_list_items FOR DELETE
  USING (auth.uid() = user_id);

-- Fix pantry_items: remove has_write_access restriction (free for all users)
DROP POLICY IF EXISTS "Users can insert their own pantry items" ON public.pantry_items;
DROP POLICY IF EXISTS "Users can update their own pantry items" ON public.pantry_items;
DROP POLICY IF EXISTS "Users can delete their own pantry items" ON public.pantry_items;

CREATE POLICY "Users can insert their own pantry items"
  ON public.pantry_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pantry items"
  ON public.pantry_items FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pantry items"
  ON public.pantry_items FOR DELETE
  USING (auth.uid() = user_id);
