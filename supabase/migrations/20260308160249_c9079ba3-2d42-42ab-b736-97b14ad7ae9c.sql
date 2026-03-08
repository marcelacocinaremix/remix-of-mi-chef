
-- Step 1: Add country to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text DEFAULT NULL;

-- Step 2: Drop old function and recreate with country
DROP FUNCTION IF EXISTS public.get_xp_leaderboard();

CREATE OR REPLACE FUNCTION public.get_xp_leaderboard()
 RETURNS TABLE(user_id uuid, display_name text, avatar_url text, total_xp integer, total_games_played integer, rank bigint, country text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    ugs.user_id,
    COALESCE(p.display_name, 'Chef') as display_name,
    p.avatar_url,
    ugs.total_xp,
    ugs.total_games_played,
    ROW_NUMBER() OVER (ORDER BY ugs.total_xp DESC) as rank,
    p.country
  FROM public.user_game_stats ugs
  LEFT JOIN public.profiles p ON p.id = ugs.user_id
  WHERE ugs.total_xp > 0
  ORDER BY ugs.total_xp DESC
  LIMIT 50;
$function$
