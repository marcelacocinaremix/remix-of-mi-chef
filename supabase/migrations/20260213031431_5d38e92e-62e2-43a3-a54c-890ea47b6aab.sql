ALTER TABLE public.meal_plans DROP CONSTRAINT meal_plans_meal_type_check;

ALTER TABLE public.meal_plans ADD CONSTRAINT meal_plans_meal_type_check CHECK (meal_type IN ('desayuno', 'almuerzo', 'merienda', 'cena'));