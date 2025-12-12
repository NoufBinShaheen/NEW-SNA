-- Add columns for meal and snack preferences
ALTER TABLE public.health_profiles 
ADD COLUMN IF NOT EXISTS meals_per_day integer DEFAULT 3,
ADD COLUMN IF NOT EXISTS snacks_per_day integer DEFAULT 2;