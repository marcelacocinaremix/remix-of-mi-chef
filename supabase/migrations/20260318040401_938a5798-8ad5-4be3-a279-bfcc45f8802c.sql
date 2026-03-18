
-- ══════════════════════════════════════════════════════════════
-- Remove trial logic from has_active_access
-- Now: only active paid subscription grants premium access.
-- Cancelled in grace period (subscription_end in future) also counts.
-- ══════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.has_active_access(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
    AND is_premium = true
    AND (subscription_end IS NULL OR subscription_end > now())
  );
$$;
