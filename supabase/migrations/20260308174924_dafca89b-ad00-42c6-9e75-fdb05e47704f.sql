
-- Step 1: Remove the public INSERT policy that allows self-awarding arbitrary achievements
DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;

-- Step 2: Create a SECURITY DEFINER function with an achievement type whitelist
CREATE OR REPLACE FUNCTION public.unlock_achievement(
  p_achievement_type text,
  p_recipe_count integer DEFAULT 0
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user uuid;
  valid_types text[] := ARRAY[
    'first_recipe', 'five_recipes', 'ten_recipes', 'twenty_recipes', 'fifty_recipes',
    'streak_3', 'streak_7',
    'game_chef', 'game_master'
  ];
BEGIN
  calling_user := auth.uid();

  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate achievement type against whitelist
  IF NOT (p_achievement_type = ANY(valid_types)) THEN
    RAISE EXCEPTION 'Invalid achievement type: %', p_achievement_type;
  END IF;

  -- Only insert if not already unlocked (idempotent)
  INSERT INTO public.user_achievements (
    user_id,
    achievement_type,
    recipe_count_at_unlock
  )
  VALUES (
    calling_user,
    p_achievement_type,
    p_recipe_count
  )
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.unlock_achievement(text, integer) TO authenticated;
