
-- Drop the restrictive RLS policies that require premium access for meal_logs
DROP POLICY IF EXISTS "Users can insert their own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can update their own meal logs" ON public.meal_logs;
DROP POLICY IF EXISTS "Users can delete their own meal logs" ON public.meal_logs;

-- Recreate them without the has_write_access premium check
-- Meal limits (3/day for free users) are enforced in the frontend
CREATE POLICY "Users can insert their own meal logs"
  ON public.meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal logs"
  ON public.meal_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal logs"
  ON public.meal_logs FOR DELETE
  USING (auth.uid() = user_id);
