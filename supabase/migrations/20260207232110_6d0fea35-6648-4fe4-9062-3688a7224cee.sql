-- Add UPDATE policy for room_messages to allow owners and admins to update
CREATE POLICY "Users can update own messages or admin"
ON public.room_messages
FOR UPDATE
USING ((auth.uid() = user_id) OR is_admin())
WITH CHECK ((auth.uid() = user_id) OR is_admin());