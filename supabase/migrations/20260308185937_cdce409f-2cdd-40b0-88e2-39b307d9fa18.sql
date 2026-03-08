
-- Create user_streaks table to track daily activity streaks
CREATE TABLE public.user_streaks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_activity_date date NULL,
  last_celebrated_milestone integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own streak"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot insert streaks directly"
  ON public.user_streaks FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Users cannot update streaks directly"
  ON public.user_streaks FOR UPDATE
  USING (false);

CREATE POLICY "Users cannot delete streaks"
  ON public.user_streaks FOR DELETE
  USING (false);

CREATE TRIGGER update_user_streaks_updated_at
  BEFORE UPDATE ON public.user_streaks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Secure server-side function to record a daily activity and update streak
CREATE OR REPLACE FUNCTION public.record_streak_activity()
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  calling_user uuid;
  streak_record RECORD;
  today date := CURRENT_DATE;
  new_streak integer;
  new_longest integer;
  milestone_reached integer := 0;
  is_new_day boolean := false;
  streak_milestone_values integer[] := ARRAY[3, 7, 14, 30, 60, 90];
  v int;
BEGIN
  calling_user := auth.uid();
  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO streak_record
  FROM public.user_streaks
  WHERE user_id = calling_user;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity_date, last_celebrated_milestone)
    VALUES (calling_user, 1, 1, today, 0);
    
    RETURN jsonb_build_object(
      'current_streak', 1,
      'longest_streak', 1,
      'is_new_day', true,
      'milestone_reached', 0,
      'already_active_today', false
    );
  END IF;

  IF streak_record.last_activity_date = today THEN
    RETURN jsonb_build_object(
      'current_streak', streak_record.current_streak,
      'longest_streak', streak_record.longest_streak,
      'is_new_day', false,
      'milestone_reached', 0,
      'already_active_today', true
    );
  END IF;

  is_new_day := true;

  IF streak_record.last_activity_date IS NULL THEN
    new_streak := 1;
  ELSIF streak_record.last_activity_date = today - interval '1 day' THEN
    new_streak := streak_record.current_streak + 1;
  ELSE
    new_streak := 1;
  END IF;

  new_longest := GREATEST(new_streak, COALESCE(streak_record.longest_streak, 0));

  FOREACH v IN ARRAY streak_milestone_values LOOP
    IF new_streak >= v AND streak_record.last_celebrated_milestone < v THEN
      milestone_reached := v;
    END IF;
  END LOOP;

  UPDATE public.user_streaks SET
    current_streak = new_streak,
    longest_streak = new_longest,
    last_activity_date = today,
    last_celebrated_milestone = CASE 
      WHEN milestone_reached > streak_record.last_celebrated_milestone 
      THEN milestone_reached 
      ELSE streak_record.last_celebrated_milestone 
    END,
    updated_at = now()
  WHERE user_id = calling_user;

  RETURN jsonb_build_object(
    'current_streak', new_streak,
    'longest_streak', new_longest,
    'is_new_day', true,
    'milestone_reached', milestone_reached,
    'already_active_today', false
  );
END;
$$;

-- Update unlock_achievement to include streak achievement types
CREATE OR REPLACE FUNCTION public.unlock_achievement(p_achievement_type text, p_recipe_count integer DEFAULT 0)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
DECLARE
  calling_user uuid;
  valid_types text[] := ARRAY[
    'first_recipe', 'five_recipes', 'ten_recipes', 'twenty_recipes', 'fifty_recipes',
    'streak_3', 'streak_7',
    'game_chef', 'game_master',
    'daily_streak_30', 'daily_streak_60', 'daily_streak_90'
  ];
BEGIN
  calling_user := auth.uid();
  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT (p_achievement_type = ANY(valid_types)) THEN
    RAISE EXCEPTION 'Invalid achievement type: %', p_achievement_type;
  END IF;

  INSERT INTO public.user_achievements (user_id, achievement_type, recipe_count_at_unlock)
  VALUES (calling_user, p_achievement_type, p_recipe_count)
  ON CONFLICT DO NOTHING;

  RETURN true;
END;
$$;
