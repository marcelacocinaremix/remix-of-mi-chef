
-- Fix workout_logs: remove has_write_access restriction (free for all users)
DROP POLICY IF EXISTS "Users can insert their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can update their own workout logs" ON public.workout_logs;
DROP POLICY IF EXISTS "Users can delete their own workout logs" ON public.workout_logs;

CREATE POLICY "Users can insert their own workout logs"
  ON public.workout_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs"
  ON public.workout_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs"
  ON public.workout_logs FOR DELETE
  USING (auth.uid() = user_id);

-- Fix user_fitness_goals: remove has_write_access restriction (free for all users)
DROP POLICY IF EXISTS "Users can insert their own fitness goals" ON public.user_fitness_goals;
DROP POLICY IF EXISTS "Users can update their own fitness goals" ON public.user_fitness_goals;

CREATE POLICY "Users can insert their own fitness goals"
  ON public.user_fitness_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness goals"
  ON public.user_fitness_goals FOR UPDATE
  USING (auth.uid() = user_id);
