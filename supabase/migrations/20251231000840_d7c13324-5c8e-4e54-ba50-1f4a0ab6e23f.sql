-- Add restrictive DELETE policy for user_subscriptions
-- Users cannot delete subscription records - only service role can (bypasses RLS)
CREATE POLICY "Users cannot delete subscriptions"
ON public.user_subscriptions
FOR DELETE
USING (false);