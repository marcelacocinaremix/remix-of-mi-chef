
-- Remove the leftover restrictive INSERT policy that still requires has_write_access
DROP POLICY IF EXISTS "Users can create their own meal plans" ON public.meal_plans;
