-- Add target_weight_kg column for goal weight tracking
ALTER TABLE public.user_fitness_goals
ADD COLUMN target_weight_kg numeric(5,2) DEFAULT NULL;