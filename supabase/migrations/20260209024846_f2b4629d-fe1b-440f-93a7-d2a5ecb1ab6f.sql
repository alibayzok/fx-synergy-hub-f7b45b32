-- Add moderation columns to user_posts table
ALTER TABLE public.user_posts 
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'flagged', 'rejected')),
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID;

-- Create index for moderation queries
CREATE INDEX IF NOT EXISTS idx_user_posts_moderation ON public.user_posts(moderation_status, is_hidden);

-- Create a table for flagged content details
CREATE TABLE IF NOT EXISTS public.flagged_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content_type TEXT NOT NULL CHECK (content_type IN ('post', 'room_message', 'thread', 'reply')),
  content_id UUID NOT NULL,
  user_id UUID NOT NULL,
  flagged_url TEXT,
  flag_reason TEXT NOT NULL,
  confidence DECIMAL(5,4),
  predictions JSONB,
  reviewed BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT CHECK (action_taken IN ('approved', 'removed', 'user_warned', 'user_banned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on flagged_content
ALTER TABLE public.flagged_content ENABLE ROW LEVEL SECURITY;

-- Only admins can view flagged content
CREATE POLICY "Admins can view flagged content"
ON public.flagged_content
FOR SELECT
USING (public.is_admin());

-- Only admins can update flagged content
CREATE POLICY "Admins can update flagged content"
ON public.flagged_content
FOR UPDATE
USING (public.is_admin());

-- System can insert flagged content (via service role or authenticated users flagging their own content check)
CREATE POLICY "Users can insert flagged content for their own posts"
ON public.flagged_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for quick lookup
CREATE INDEX IF NOT EXISTS idx_flagged_content_reviewed ON public.flagged_content(reviewed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flagged_content_content ON public.flagged_content(content_type, content_id);