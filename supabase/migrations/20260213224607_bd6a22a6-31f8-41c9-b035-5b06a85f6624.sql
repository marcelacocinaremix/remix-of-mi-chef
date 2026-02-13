CREATE OR REPLACE FUNCTION public.check_and_increment_daily_uses(p_user_id uuid, p_daily_limit integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_uses INTEGER;
  current_date_val DATE := CURRENT_DATE;
  result jsonb;
BEGIN
  INSERT INTO public.user_subscriptions (user_id, daily_uses, last_use_date)
  VALUES (p_user_id, 0, current_date_val)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_subscriptions
  SET 
    daily_uses = CASE 
      WHEN last_use_date IS NULL OR last_use_date < current_date_val THEN 0 
      ELSE daily_uses 
    END,
    last_use_date = current_date_val,
    updated_at = now()
  WHERE user_id = p_user_id;

  SELECT daily_uses INTO current_uses
  FROM public.user_subscriptions
  WHERE user_id = p_user_id;

  IF current_uses < p_daily_limit THEN
    UPDATE public.user_subscriptions
    SET daily_uses = daily_uses + 1, updated_at = now()
    WHERE user_id = p_user_id
    RETURNING daily_uses INTO current_uses;
    
    result := jsonb_build_object(
      'allowed', true,
      'uses_today', current_uses,
      'remaining', p_daily_limit - current_uses
    );
  ELSE
    result := jsonb_build_object(
      'allowed', false,
      'uses_today', current_uses,
      'remaining', 0,
      'message', '¡Se acabaron tus recetas de hoy! Volvé mañana para seguir cocinando 🍳'
    );
  END IF;

  RETURN result;
END;
$function$;