-- Add policy to allow anyone to read shared recipes that haven't expired
-- This enables the share functionality to work for recipients
CREATE POLICY "Anyone can view shared recipes by share code" 
ON public.shared_recipes 
FOR SELECT 
USING (
  expires_at IS NULL OR expires_at > now()
);