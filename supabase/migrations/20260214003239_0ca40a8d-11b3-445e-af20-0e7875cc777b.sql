
-- Add is_broadcast column to community_rooms
ALTER TABLE public.community_rooms 
ADD COLUMN is_broadcast boolean NOT NULL DEFAULT false;

-- Add comment
COMMENT ON COLUMN public.community_rooms.is_broadcast IS 'If true, only admins/moderators can post messages';
