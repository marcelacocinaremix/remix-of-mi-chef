
-- Function: save_game_result
-- Validates, caps, and stores a game session, then updates user_game_stats atomically.
CREATE OR REPLACE FUNCTION public.save_game_result(
  p_score        integer,
  p_streak       integer,
  p_recipes_completed integer,
  p_time_played  integer,
  p_mode         text,
  p_xp_earned    integer DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  calling_user uuid := auth.uid();
  -- Server-side caps to prevent score manipulation
  safe_score        integer := LEAST(GREATEST(COALESCE(p_score, 0), 0), 9999);
  safe_streak       integer := LEAST(GREATEST(COALESCE(p_streak, 0), 0), 999);
  safe_recipes      integer := LEAST(GREATEST(COALESCE(p_recipes_completed, 0), 0), 100);
  safe_time         integer := LEAST(GREATEST(COALESCE(p_time_played, 0), 0), 7200);
  safe_xp           integer := LEAST(GREATEST(COALESCE(p_xp_earned, 0), 0), 2000);
  valid_modes       text[]  := ARRAY['recipe', 'order', 'ingredients', 'timer'];
  safe_mode         text;
BEGIN
  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate mode
  IF p_mode = ANY(valid_modes) THEN
    safe_mode := p_mode;
  ELSE
    safe_mode := 'recipe';
  END IF;

  -- Insert game session
  INSERT INTO public.game_sessions (
    user_id, score, streak, recipes_completed, time_played, mode, xp_earned, played_at
  ) VALUES (
    calling_user, safe_score, safe_streak, safe_recipes, safe_time, safe_mode, safe_xp, now()
  );

  -- Upsert user_game_stats
  INSERT INTO public.user_game_stats (
    user_id, high_score, total_games_played, best_streak,
    total_recipes_completed, total_time_played, total_xp, last_played_at
  )
  VALUES (
    calling_user, safe_score, 1, safe_streak,
    safe_recipes, safe_time, safe_xp, now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    high_score              = GREATEST(user_game_stats.high_score, safe_score),
    total_games_played      = user_game_stats.total_games_played + 1,
    best_streak             = GREATEST(user_game_stats.best_streak, safe_streak),
    total_recipes_completed = user_game_stats.total_recipes_completed + safe_recipes,
    total_time_played       = user_game_stats.total_time_played + safe_time,
    total_xp                = user_game_stats.total_xp + safe_xp,
    last_played_at          = now(),
    updated_at              = now();

  RETURN jsonb_build_object(
    'success', true,
    'score', safe_score,
    'xp_earned', safe_xp
  );
END;
$$;
