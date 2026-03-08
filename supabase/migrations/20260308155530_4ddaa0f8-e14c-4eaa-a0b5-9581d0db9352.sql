
-- Add total_xp column to user_game_stats
ALTER TABLE public.user_game_stats 
ADD COLUMN IF NOT EXISTS total_xp integer NOT NULL DEFAULT 0;

-- Function to get XP leaderboard (top 50 users)
CREATE OR REPLACE FUNCTION public.get_xp_leaderboard()
RETURNS TABLE(
  user_id uuid,
  display_name text,
  avatar_url text,
  total_xp integer,
  total_games_played integer,
  rank bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ugs.user_id,
    COALESCE(p.display_name, 'Chef') as display_name,
    p.avatar_url,
    ugs.total_xp,
    ugs.total_games_played,
    ROW_NUMBER() OVER (ORDER BY ugs.total_xp DESC) as rank
  FROM public.user_game_stats ugs
  LEFT JOIN public.profiles p ON p.id = ugs.user_id
  WHERE ugs.total_xp > 0
  ORDER BY ugs.total_xp DESC
  LIMIT 50;
$$;
