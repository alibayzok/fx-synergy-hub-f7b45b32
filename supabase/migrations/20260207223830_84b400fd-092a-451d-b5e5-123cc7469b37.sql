-- ============================================
-- Community Tables: Threads, Replies, Messages, Notifications
-- ============================================

-- 1. Threads Table (المواضيع)
CREATE TABLE public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    tag TEXT NOT NULL CHECK (tag IN ('question', 'analysis', 'alert', 'help')),
    replies_count INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    has_best_answer BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Replies Table (الردود)
CREATE TABLE public.replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    parent_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_best_answer BOOLEAN DEFAULT false,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Room Messages Table (رسائل الغرف - الدردشة المباشرة)
CREATE TABLE public.room_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. User Notifications Table (إشعارات المستخدمين)
CREATE TABLE public.user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Reply Likes Table (إعجابات الردود)
CREATE TABLE public.reply_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reply_id UUID NOT NULL REFERENCES public.replies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(reply_id, user_id)
);

-- ============================================
-- Enable RLS on all tables
-- ============================================
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Threads
-- ============================================
-- Everyone authenticated can read threads (VIP rooms handled in app logic)
CREATE POLICY "Users can view all threads"
ON public.threads FOR SELECT
TO authenticated
USING (true);

-- Users can create their own threads
CREATE POLICY "Users can create threads"
ON public.threads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can update their own threads, admins can update any
CREATE POLICY "Users can update own threads"
ON public.threads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- Users can delete their own threads, admins can delete any
CREATE POLICY "Users can delete own threads"
ON public.threads FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- ============================================
-- RLS Policies for Replies
-- ============================================
CREATE POLICY "Users can view all replies"
ON public.replies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create replies"
ON public.replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies"
ON public.replies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own replies"
ON public.replies FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- ============================================
-- RLS Policies for Room Messages
-- ============================================
CREATE POLICY "Users can view room messages"
ON public.room_messages FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can send messages"
ON public.room_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete own messages"
ON public.room_messages FOR DELETE
TO authenticated
USING (auth.uid() = user_id OR is_admin());

-- ============================================
-- RLS Policies for User Notifications
-- ============================================
CREATE POLICY "Users can view own notifications"
ON public.user_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
ON public.user_notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Reply Likes
-- ============================================
CREATE POLICY "Users can view all likes"
ON public.reply_likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can like replies"
ON public.reply_likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
ON public.reply_likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ============================================
-- Triggers and Functions
-- ============================================

-- Update replies_count on threads when reply is added/removed
CREATE OR REPLACE FUNCTION public.update_thread_replies_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.threads SET replies_count = replies_count + 1 WHERE id = NEW.thread_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.threads SET replies_count = replies_count - 1 WHERE id = OLD.thread_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_replies_count
AFTER INSERT OR DELETE ON public.replies
FOR EACH ROW EXECUTE FUNCTION public.update_thread_replies_count();

-- Update likes_count on replies when like is added/removed
CREATE OR REPLACE FUNCTION public.update_reply_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.replies SET likes_count = likes_count + 1 WHERE id = NEW.reply_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.replies SET likes_count = likes_count - 1 WHERE id = OLD.reply_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_likes_count
AFTER INSERT OR DELETE ON public.reply_likes
FOR EACH ROW EXECUTE FUNCTION public.update_reply_likes_count();

-- Notify thread owner when someone replies
CREATE OR REPLACE FUNCTION public.notify_thread_owner_on_reply()
RETURNS TRIGGER AS $$
DECLARE
    thread_owner_id UUID;
    thread_title TEXT;
    replier_name TEXT;
BEGIN
    -- Get thread owner and title
    SELECT user_id, title INTO thread_owner_id, thread_title
    FROM public.threads WHERE id = NEW.thread_id;
    
    -- Don't notify if replying to own thread
    IF thread_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get replier display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO replier_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        thread_owner_id,
        'reply',
        'رد جديد',
        replier_name || ' رد على موضوعك: ' || LEFT(thread_title, 50),
        jsonb_build_object(
            'thread_id', NEW.thread_id,
            'reply_id', NEW.id,
            'replier_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_notify_on_reply
AFTER INSERT ON public.replies
FOR EACH ROW EXECUTE FUNCTION public.notify_thread_owner_on_reply();

-- Enable realtime for messages and notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.replies;

-- Indexes for better performance
CREATE INDEX idx_threads_room_id ON public.threads(room_id);
CREATE INDEX idx_threads_user_id ON public.threads(user_id);
CREATE INDEX idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX idx_replies_thread_id ON public.replies(thread_id);
CREATE INDEX idx_replies_user_id ON public.replies(user_id);
CREATE INDEX idx_room_messages_room_id ON public.room_messages(room_id);
CREATE INDEX idx_room_messages_created_at ON public.room_messages(created_at DESC);
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON public.user_notifications(user_id, read);