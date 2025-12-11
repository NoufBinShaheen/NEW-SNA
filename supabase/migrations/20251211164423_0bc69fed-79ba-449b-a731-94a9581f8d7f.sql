-- Add last_coach_session column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN last_coach_session timestamp with time zone DEFAULT NULL;

-- Add reminder_frequency column (daily, weekly, none)
ALTER TABLE public.profiles 
ADD COLUMN coach_reminder_frequency text DEFAULT 'weekly';

-- Enable pg_cron and pg_net extensions for scheduled reminders
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;