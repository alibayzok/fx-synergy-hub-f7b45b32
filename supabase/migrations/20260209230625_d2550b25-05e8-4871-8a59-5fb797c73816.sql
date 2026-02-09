
-- Add onboarding tracking and trading preferences to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trading_preferences jsonb DEFAULT null;
