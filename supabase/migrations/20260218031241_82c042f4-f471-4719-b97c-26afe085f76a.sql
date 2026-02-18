
-- Function to check if user has active access (premium OR trial active)
CREATE OR REPLACE FUNCTION public.has_active_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND (
      -- Premium with active subscription
      (is_premium = true AND (subscription_end IS NULL OR subscription_end > now()))
      OR
      -- Trial still active
      (trial_end_date IS NOT NULL AND trial_end_date > now())
    )
  );
$$;

-- Function to check if user has WRITE access (same as has_active_access, used for clarity)
-- Read access stays open so users can see their old data; writes are blocked
CREATE OR REPLACE FUNCTION public.has_write_access(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_active_access(p_user_id);
$$;

-- ============================================
-- MEAL_PLANS: block INSERT/UPDATE/DELETE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can create their own meal plans" ON public.meal_plans;
CREATE POLICY "Users can create their own meal plans"
  ON public.meal_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own meal plans" ON public.meal_plans;
CREATE POLICY "Users can update their own meal plans"
  ON public.meal_plans FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own meal plans" ON public.meal_plans;
CREATE POLICY "Users can delete their own meal plans"
  ON public.meal_plans FOR DELETE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

-- ============================================
-- PANTRY_ITEMS: block INSERT/UPDATE/DELETE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own pantry items" ON public.pantry_items;
CREATE POLICY "Users can insert their own pantry items"
  ON public.pantry_items FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own pantry items" ON public.pantry_items;
CREATE POLICY "Users can update their own pantry items"
  ON public.pantry_items FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own pantry items" ON public.pantry_items;
CREATE POLICY "Users can delete their own pantry items"
  ON public.pantry_items FOR DELETE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

-- ============================================
-- SHOPPING_LIST_ITEMS: block INSERT/UPDATE/DELETE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own shopping list items" ON public.shopping_list_items;
CREATE POLICY "Users can insert their own shopping list items"
  ON public.shopping_list_items FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own shopping list items" ON public.shopping_list_items;
CREATE POLICY "Users can update their own shopping list items"
  ON public.shopping_list_items FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own shopping list items" ON public.shopping_list_items;
CREATE POLICY "Users can delete their own shopping list items"
  ON public.shopping_list_items FOR DELETE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

-- ============================================
-- MEAL_LOGS (Balance nutricional): block INSERT/UPDATE/DELETE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can insert their own meal logs"
  ON public.meal_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can update their own meal logs"
  ON public.meal_logs FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own meal logs" ON public.meal_logs;
CREATE POLICY "Users can delete their own meal logs"
  ON public.meal_logs FOR DELETE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

-- ============================================
-- WORKOUT_LOGS (Actividad): block INSERT/UPDATE/DELETE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can insert their own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can update their own workout logs"
  ON public.workout_logs FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own workout logs" ON public.workout_logs;
CREATE POLICY "Users can delete their own workout logs"
  ON public.workout_logs FOR DELETE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

-- ============================================
-- USER_FITNESS_GOALS: block INSERT/UPDATE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own fitness goals" ON public.user_fitness_goals;
CREATE POLICY "Users can insert their own fitness goals"
  ON public.user_fitness_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own fitness goals" ON public.user_fitness_goals;
CREATE POLICY "Users can update their own fitness goals"
  ON public.user_fitness_goals FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

-- ============================================
-- USER_LEARNING_PROGRESS: block INSERT/UPDATE/DELETE when expired
-- ============================================
DROP POLICY IF EXISTS "Users can insert their own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can insert their own learning progress"
  ON public.user_learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can update their own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can update their own learning progress"
  ON public.user_learning_progress FOR UPDATE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own learning progress" ON public.user_learning_progress;
CREATE POLICY "Users can delete their own learning progress"
  ON public.user_learning_progress FOR DELETE
  USING (auth.uid() = user_id AND public.has_write_access(auth.uid()));
