-- Create enum for fitness goals
CREATE TYPE public.fitness_goal AS ENUM ('lose_fat', 'gain_muscle', 'stay_active', 'improve_performance');

-- Create enum for workout types
CREATE TYPE public.workout_type AS ENUM ('strength', 'cardio', 'boxing', 'functional', 'yoga', 'swimming', 'running', 'cycling', 'hiit', 'other');

-- Create table for user fitness goals
CREATE TABLE public.user_fitness_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  goal public.fitness_goal NOT NULL DEFAULT 'stay_active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique constraint to ensure one active goal per user
CREATE UNIQUE INDEX idx_user_fitness_goals_user ON public.user_fitness_goals(user_id);

-- Enable RLS
ALTER TABLE public.user_fitness_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_fitness_goals
CREATE POLICY "Users can view their own fitness goals" 
ON public.user_fitness_goals 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own fitness goals" 
ON public.user_fitness_goals 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fitness goals" 
ON public.user_fitness_goals 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create table for workout logs
CREATE TABLE public.workout_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  workout_type public.workout_type NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  calories_burned INTEGER,
  notes TEXT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_workout_logs_user_date ON public.workout_logs(user_id, workout_date DESC);

-- Enable RLS
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for workout_logs
CREATE POLICY "Users can view their own workout logs" 
ON public.workout_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workout logs" 
ON public.workout_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workout logs" 
ON public.workout_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workout logs" 
ON public.workout_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger for updating timestamps
CREATE TRIGGER update_user_fitness_goals_updated_at
BEFORE UPDATE ON public.user_fitness_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();