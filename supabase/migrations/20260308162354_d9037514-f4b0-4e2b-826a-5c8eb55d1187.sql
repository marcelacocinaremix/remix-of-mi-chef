
-- Drop existing restrictive policies that require has_write_access
DROP POLICY IF EXISTS "Users can insert their own learning progress" ON public.user_learning_progress;
DROP POLICY IF EXISTS "Users can update their own learning progress" ON public.user_learning_progress;
DROP POLICY IF EXISTS "Users can delete their own learning progress" ON public.user_learning_progress;

-- Recreate policies allowing ALL authenticated users (no subscription required)
-- Learning progress should be trackable regardless of subscription status
CREATE POLICY "Users can insert their own learning progress"
  ON public.user_learning_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own learning progress"
  ON public.user_learning_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own learning progress"
  ON public.user_learning_progress
  FOR DELETE
  USING (auth.uid() = user_id);
