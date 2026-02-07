-- Drop and recreate the conversations INSERT policy to be more permissive for authenticated users
DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Also make sure the conversation_participants INSERT policy works for new conversations
DROP POLICY IF EXISTS "Conversation creator can add participants" ON public.conversation_participants;

CREATE POLICY "Conversation creator can add participants"
ON public.conversation_participants FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id OR
    public.is_conversation_creator(conversation_id) OR
    public.is_conversation_admin(conversation_id)
);