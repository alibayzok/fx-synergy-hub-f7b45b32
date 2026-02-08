-- Add friends visibility privacy enum
ALTER TYPE messaging_privacy RENAME TO privacy_setting;

-- Add friends_visibility column to user_privacy_settings
ALTER TABLE public.user_privacy_settings 
ADD COLUMN friends_visibility privacy_setting NOT NULL DEFAULT 'everyone';