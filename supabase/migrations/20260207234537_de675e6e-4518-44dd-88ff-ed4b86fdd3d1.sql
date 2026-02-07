-- Drop the problematic policies
DROP POLICY IF EXISTS "Participants can view their conversations" ON public.conversation_participants;
DROP POLICY IF EXISTS "Conversation creator can add participants" ON public.conversation_participants;

-- Create a security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conv_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id
    )
$$;

-- Create a function to check if user is conversation admin
CREATE OR REPLACE FUNCTION public.is_conversation_admin(conv_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conv_id AND user_id = check_user_id AND is_admin = true
    )
$$;

-- Create a function to check if user is conversation creator
CREATE OR REPLACE FUNCTION public.is_conversation_creator(conv_id UUID, check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conv_id AND created_by = check_user_id
    )
$$;

-- Recreate policies using the security definer functions
CREATE POLICY "Participants can view their conversations"
ON public.conversation_participants FOR SELECT
USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "Conversation creator can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
    auth.uid() = user_id OR
    public.is_conversation_creator(conversation_id) OR
    public.is_conversation_admin(conversation_id)
);

-- Also fix the conversations and direct_messages policies that reference conversation_participants
DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
DROP POLICY IF EXISTS "Conversation admins can update" ON public.conversations;
DROP POLICY IF EXISTS "Participants can view messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Participants can send messages" ON public.direct_messages;

CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (public.is_conversation_participant(id));

CREATE POLICY "Conversation admins can update"
ON public.conversations FOR UPDATE
USING (public.is_conversation_admin(id));

CREATE POLICY "Participants can view messages"
ON public.direct_messages FOR SELECT
USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "Participants can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    public.is_conversation_participant(conversation_id)
);