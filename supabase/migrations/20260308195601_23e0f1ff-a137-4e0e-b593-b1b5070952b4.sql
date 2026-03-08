
CREATE OR REPLACE FUNCTION public.get_streak_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  current_streak integer,
  longest_streak integer,
  country text,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    us.user_id,
    COALESCE(p.display_name, 'Chef') AS display_name,
    p.avatar_url,
    us.current_streak,
    us.longest_streak,
    p.country,
    ROW_NUMBER() OVER (ORDER BY us.current_streak DESC, us.longest_streak DESC) AS rank
  FROM public.user_streaks us
  LEFT JOIN public.profiles p ON p.id = us.user_id
  WHERE us.current_streak > 0
  ORDER BY us.current_streak DESC, us.longest_streak DESC
  LIMIT 50;
$$;
