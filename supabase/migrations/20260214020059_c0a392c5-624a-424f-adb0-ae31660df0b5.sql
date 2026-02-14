
-- Fix RLS: Allow conversation participants to mark messages as read (not just sender)
DROP POLICY IF EXISTS "Senders can update own messages" ON public.direct_messages;

CREATE POLICY "Participants can update messages read status"
ON public.direct_messages
FOR UPDATE
USING (
  (auth.uid() = sender_id) OR 
  (is_conversation_participant(conversation_id) AND auth.uid() IS NOT NULL)
)
WITH CHECK (
  (auth.uid() = sender_id) OR 
  (is_conversation_participant(conversation_id) AND auth.uid() IS NOT NULL)
);
