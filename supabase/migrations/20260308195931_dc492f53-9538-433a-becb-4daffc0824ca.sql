
-- Fix timezone bug: use Argentina timezone (UTC-3) for date calculations
-- This ensures that "today" matches the user's local date regardless of server UTC
CREATE OR REPLACE FUNCTION public.record_streak_activity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user uuid;
  streak_record RECORD;
  -- Use Argentina timezone (UTC-3) to avoid midnight boundary bugs for South American users
  today date := (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date;
  yesterday date := today - interval '1 day';
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

  -- First time ever
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

  -- Already active today → nothing to do
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

  -- Core logic: consecutive day → increment; any gap → reset to 1
  IF streak_record.last_activity_date IS NULL THEN
    new_streak := 1;
  ELSIF streak_record.last_activity_date = yesterday THEN
    -- Entered yesterday: streak continues
    new_streak := streak_record.current_streak + 1;
  ELSE
    -- Missed at least one day: reset
    new_streak := 1;
  END IF;

  new_longest := GREATEST(new_streak, COALESCE(streak_record.longest_streak, 0));

  -- Find highest uncelebrated milestone
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
