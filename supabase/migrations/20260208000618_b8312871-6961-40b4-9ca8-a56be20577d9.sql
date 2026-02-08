-- Fix: allow conversation creator to SELECT their newly created conversation
-- because PostgREST returns representation on INSERT before participants are inserted.

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;

CREATE POLICY "Users can view their conversations"
ON public.conversations
FOR SELECT
TO public
USING (
  public.is_conversation_participant(id)
  OR created_by = auth.uid()
);
