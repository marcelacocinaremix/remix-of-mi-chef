
CREATE TABLE public.game_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mode TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  recipes_completed INTEGER NOT NULL DEFAULT 0,
  time_played INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own game sessions"
  ON public.game_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game sessions"
  ON public.game_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_game_sessions_user_id ON public.game_sessions (user_id, played_at DESC);
