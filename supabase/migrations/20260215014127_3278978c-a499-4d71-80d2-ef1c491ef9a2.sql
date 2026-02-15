
-- Add mute columns to room_members
ALTER TABLE public.room_members
ADD COLUMN is_muted boolean NOT NULL DEFAULT false,
ADD COLUMN muted_until timestamp with time zone DEFAULT NULL,
ADD COLUMN muted_reason text DEFAULT NULL;
