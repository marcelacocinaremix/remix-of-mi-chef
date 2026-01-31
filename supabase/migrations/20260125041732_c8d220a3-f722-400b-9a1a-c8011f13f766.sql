-- Add new columns to user_fitness_goals for activity profile
ALTER TABLE public.user_fitness_goals 
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS target_weeks INTEGER DEFAULT 12,
ADD COLUMN IF NOT EXISTS target_date DATE,
ADD COLUMN IF NOT EXISTS weekly_workout_target INTEGER DEFAULT 3;

-- Add comments for documentation
COMMENT ON COLUMN public.user_fitness_goals.weight_kg IS 'User weight in kilograms';
COMMENT ON COLUMN public.user_fitness_goals.height_cm IS 'User height in centimeters';
COMMENT ON COLUMN public.user_fitness_goals.target_weeks IS 'Target timeframe in weeks (4, 12, or 26)';
COMMENT ON COLUMN public.user_fitness_goals.target_date IS 'Custom target date if not using preset weeks';
COMMENT ON COLUMN public.user_fitness_goals.weekly_workout_target IS 'Weekly workout frequency goal (2, 3, or 4+)';