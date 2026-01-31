-- Allow anyone with the share_code to read shared recipes (non-expired)
CREATE POLICY "Anyone can view shared recipes by share_code" 
ON public.shared_recipes 
FOR SELECT 
USING (
  expires_at IS NULL OR expires_at > now()
);