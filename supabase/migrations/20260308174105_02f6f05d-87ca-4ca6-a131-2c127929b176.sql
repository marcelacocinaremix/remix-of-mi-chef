-- Fix missing DELETE policy on user_game_stats (GDPR compliance)
CREATE POLICY "Users can delete their own game stats"
ON public.user_game_stats
FOR DELETE
USING (auth.uid() = user_id);