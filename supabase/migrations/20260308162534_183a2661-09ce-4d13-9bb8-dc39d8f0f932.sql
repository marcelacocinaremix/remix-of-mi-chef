
-- Drop existing restrictive policies that require has_write_access for meal_plans
DROP POLICY IF EXISTS "Users can insert their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Users can view their own meal plans" ON public.meal_plans;

-- Recreate policies allowing ALL authenticated users (no subscription required)
CREATE POLICY "Users can view their own meal plans"
  ON public.meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meal plans"
  ON public.meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans"
  ON public.meal_plans
  FOR DELETE
  USING (auth.uid() = user_id);
