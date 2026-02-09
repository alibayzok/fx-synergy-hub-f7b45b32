-- Update RLS policy for room_messages: Moderators can delete but NOT update others' messages
DROP POLICY IF EXISTS "Users can update own messages or admin" ON public.room_messages;

-- Only message owner can update their messages
CREATE POLICY "Users can update own messages"
ON public.room_messages
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Update delete policy to include room moderators
DROP POLICY IF EXISTS "Users can delete own messages" ON public.room_messages;

CREATE POLICY "Users or moderators can delete messages"
ON public.room_messages
FOR DELETE
USING (
    auth.uid() = user_id OR 
    is_admin() OR 
    is_room_moderator(room_id)
);

-- Similarly for replies in threads
DROP POLICY IF EXISTS "Users can update own replies" ON public.replies;

CREATE POLICY "Users can update own replies"
ON public.replies
FOR UPDATE
USING (auth.uid() = user_id OR is_admin())
WITH CHECK (auth.uid() = user_id OR is_admin());

-- Moderators can delete replies but not update
DROP POLICY IF EXISTS "Users can delete own replies" ON public.replies;

-- Get room_id from thread for reply deletion check
CREATE OR REPLACE FUNCTION public.get_thread_room_id(p_thread_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT room_id FROM public.threads WHERE id = p_thread_id
$$;

CREATE POLICY "Users or moderators can delete replies"
ON public.replies
FOR DELETE
USING (
    auth.uid() = user_id OR 
    is_admin() OR 
    is_room_moderator(get_thread_room_id(thread_id))
);