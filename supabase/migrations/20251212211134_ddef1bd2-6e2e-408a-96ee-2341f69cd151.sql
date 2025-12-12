-- Add columns for custom nutrition targets
ALTER TABLE public.health_profiles 
ADD COLUMN IF NOT EXISTS custom_calories integer,
ADD COLUMN IF NOT EXISTS custom_protein integer,
ADD COLUMN IF NOT EXISTS custom_carbs integer,
ADD COLUMN IF NOT EXISTS custom_fat integer;