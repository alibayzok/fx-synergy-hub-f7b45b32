
-- Create user_blocks table
CREATE TABLE public.user_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- Enable RLS
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
ON public.user_blocks FOR SELECT
USING (auth.uid() = blocker_id);

-- Users can block others
CREATE POLICY "Users can block others"
ON public.user_blocks FOR INSERT
WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

-- Users can unblock others
CREATE POLICY "Users can unblock others"
ON public.user_blocks FOR DELETE
USING (auth.uid() = blocker_id);

-- Admins can view all blocks
CREATE POLICY "Admins can view all blocks"
ON public.user_blocks FOR SELECT
USING (is_admin());

-- Create a helper function to check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_blocked(checker_id uuid, target_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = checker_id AND blocked_id = target_id)
       OR (blocker_id = target_id AND blocked_id = checker_id)
  );
$$;
