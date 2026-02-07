-- Create messaging_privacy enum
CREATE TYPE public.messaging_privacy AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');

-- Create friend_request_status enum
CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'rejected');

-- Create conversation_type enum
CREATE TYPE public.conversation_type AS ENUM ('direct', 'group');

-- User privacy settings table
CREATE TABLE public.user_privacy_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    messaging_privacy messaging_privacy NOT NULL DEFAULT 'everyone',
    show_online_status BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Follows table (one-way relationship)
CREATE TABLE public.follows (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL,
    following_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Friend requests table
CREATE TABLE public.friend_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status friend_request_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(sender_id, receiver_id),
    CHECK (sender_id != receiver_id)
);

-- Conversations table
CREATE TABLE public.conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type conversation_type NOT NULL DEFAULT 'direct',
    name TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conversation participants table
CREATE TABLE public.conversation_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_read_at TIMESTAMP WITH TIME ZONE,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(conversation_id, user_id)
);

-- Direct messages table
CREATE TABLE public.direct_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_privacy_settings
CREATE POLICY "Users can view all privacy settings"
ON public.user_privacy_settings FOR SELECT
USING (true);

CREATE POLICY "Users can insert own privacy settings"
ON public.user_privacy_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
ON public.user_privacy_settings FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for follows
CREATE POLICY "Anyone can view follows"
ON public.follows FOR SELECT
USING (true);

CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
USING (auth.uid() = follower_id);

-- RLS Policies for friend_requests
CREATE POLICY "Users can view own friend requests"
ON public.friend_requests FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received requests"
ON public.friend_requests FOR UPDATE
USING (auth.uid() = receiver_id OR auth.uid() = sender_id);

CREATE POLICY "Users can delete own requests"
ON public.friend_requests FOR DELETE
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- RLS Policies for conversations
CREATE POLICY "Users can view their conversations"
ON public.conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create conversations"
ON public.conversations FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Conversation admins can update"
ON public.conversations FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = id AND user_id = auth.uid() AND is_admin = true
    )
);

-- RLS Policies for conversation_participants
CREATE POLICY "Participants can view their conversations"
ON public.conversation_participants FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants cp
        WHERE cp.conversation_id = conversation_id AND cp.user_id = auth.uid()
    )
);

CREATE POLICY "Conversation creator can add participants"
ON public.conversation_participants FOR INSERT
WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id AND created_by = auth.uid()
    ) OR
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = conversation_participants.conversation_id 
        AND user_id = auth.uid() AND is_admin = true
    )
);

CREATE POLICY "Participants can update their own record"
ON public.conversation_participants FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can leave conversations"
ON public.conversation_participants FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for direct_messages
CREATE POLICY "Participants can view messages"
ON public.direct_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Participants can send messages"
ON public.direct_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = direct_messages.conversation_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Senders can update own messages"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Senders can delete own messages"
ON public.direct_messages FOR DELETE
USING (auth.uid() = sender_id);

-- Create indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);
CREATE INDEX idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conv ON public.conversation_participants(conversation_id);
CREATE INDEX idx_direct_messages_conversation ON public.direct_messages(conversation_id);
CREATE INDEX idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX idx_direct_messages_created ON public.direct_messages(created_at DESC);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;

-- Trigger for updating timestamps
CREATE TRIGGER update_user_privacy_settings_updated_at
BEFORE UPDATE ON public.user_privacy_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_friend_requests_updated_at
BEFORE UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_direct_messages_updated_at
BEFORE UPDATE ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if users can message each other
CREATE OR REPLACE FUNCTION public.can_message_user(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    privacy_setting messaging_privacy;
    is_friend BOOLEAN;
    is_follower BOOLEAN;
BEGIN
    -- Get target user's privacy setting
    SELECT messaging_privacy INTO privacy_setting
    FROM public.user_privacy_settings
    WHERE user_id = target_user_id;
    
    -- If no settings, default to everyone
    IF privacy_setting IS NULL THEN
        RETURN true;
    END IF;
    
    -- Check based on privacy setting
    CASE privacy_setting
        WHEN 'everyone' THEN
            RETURN true;
        WHEN 'nobody' THEN
            RETURN false;
        WHEN 'friends_only' THEN
            -- Check if they are friends (mutual accepted friend requests)
            SELECT EXISTS (
                SELECT 1 FROM public.friend_requests
                WHERE status = 'accepted'
                AND ((sender_id = auth.uid() AND receiver_id = target_user_id)
                     OR (sender_id = target_user_id AND receiver_id = auth.uid()))
            ) INTO is_friend;
            RETURN is_friend;
        WHEN 'followers_only' THEN
            -- Check if current user follows target
            SELECT EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = target_user_id
            ) INTO is_follower;
            RETURN is_follower;
        ELSE
            RETURN true;
    END CASE;
END;
$$;

-- Function to check if users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user1_id UUID, user2_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.friend_requests
        WHERE status = 'accepted'
        AND ((sender_id = user1_id AND receiver_id = user2_id)
             OR (sender_id = user2_id AND receiver_id = user1_id))
    )
$$;

-- Function to notify user of new message
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name TEXT;
    conv_name TEXT;
    recipient RECORD;
BEGIN
    -- Get sender name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name
    FROM public.profiles WHERE user_id = NEW.sender_id;
    
    -- Get conversation name or type
    SELECT name, type INTO conv_name FROM public.conversations WHERE id = NEW.conversation_id;
    
    -- Notify all participants except sender
    FOR recipient IN
        SELECT user_id FROM public.conversation_participants
        WHERE conversation_id = NEW.conversation_id AND user_id != NEW.sender_id
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            recipient.user_id,
            'message',
            'رسالة جديدة',
            sender_name || ': ' || LEFT(NEW.content, 50),
            jsonb_build_object(
                'conversation_id', NEW.conversation_id,
                'message_id', NEW.id,
                'sender_id', NEW.sender_id
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_new_message
AFTER INSERT ON public.direct_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- Function to notify friend request
CREATE OR REPLACE FUNCTION public.notify_friend_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    sender_name TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name
        FROM public.profiles WHERE user_id = NEW.sender_id;
        
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            NEW.receiver_id,
            'friend_request',
            'طلب صداقة جديد',
            sender_name || ' أرسل لك طلب صداقة',
            jsonb_build_object('request_id', NEW.id, 'sender_id', NEW.sender_id)
        );
    ELSIF TG_OP = 'UPDATE' AND NEW.status = 'accepted' AND OLD.status = 'pending' THEN
        SELECT COALESCE(display_name, username, 'مستخدم') INTO sender_name
        FROM public.profiles WHERE user_id = NEW.receiver_id;
        
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            NEW.sender_id,
            'friend_accepted',
            'تم قبول طلب الصداقة',
            sender_name || ' قبل طلب صداقتك',
            jsonb_build_object('request_id', NEW.id, 'friend_id', NEW.receiver_id)
        );
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_friend_request
AFTER INSERT OR UPDATE ON public.friend_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_friend_request();