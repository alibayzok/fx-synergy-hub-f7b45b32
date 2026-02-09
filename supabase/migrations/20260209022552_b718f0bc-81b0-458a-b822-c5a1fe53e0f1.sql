-- ============================================================
-- إشعارات المنشورات والتعليقات
-- ============================================================

-- 1. إشعار عند الإعجاب بمنشور
CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    post_owner_id UUID;
    liker_name TEXT;
    post_preview TEXT;
BEGIN
    -- Get post owner
    SELECT user_id, LEFT(content, 50) INTO post_owner_id, post_preview
    FROM public.user_posts WHERE id = NEW.post_id;
    
    -- Don't notify if liking own post
    IF post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get liker display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        post_owner_id,
        'post_like',
        'إعجاب جديد ❤️',
        liker_name || ' أعجب بمنشورك',
        jsonb_build_object(
            'post_id', NEW.post_id,
            'liker_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for post likes
DROP TRIGGER IF EXISTS notify_on_post_like ON public.post_likes;
CREATE TRIGGER notify_on_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_like();

-- ============================================================

-- 2. إشعار عند التعليق على منشور
CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    post_owner_id UUID;
    commenter_name TEXT;
    post_preview TEXT;
    parent_commenter_id UUID;
BEGIN
    -- Get post owner
    SELECT user_id, LEFT(content, 50) INTO post_owner_id, post_preview
    FROM public.user_posts WHERE id = NEW.post_id;
    
    -- Get commenter display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO commenter_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- If this is a reply to another comment, notify the parent commenter
    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id INTO parent_commenter_id
        FROM public.post_comments WHERE id = NEW.parent_id;
        
        -- Notify parent commenter (if not the same person)
        IF parent_commenter_id IS NOT NULL AND parent_commenter_id != NEW.user_id THEN
            INSERT INTO public.user_notifications (user_id, type, title, message, data)
            VALUES (
                parent_commenter_id,
                'comment_reply',
                'رد على تعليقك 💬',
                commenter_name || ' رد على تعليقك',
                jsonb_build_object(
                    'post_id', NEW.post_id,
                    'comment_id', NEW.id,
                    'commenter_id', NEW.user_id
                )
            );
        END IF;
    END IF;
    
    -- Don't notify if commenting on own post
    IF post_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Notify post owner
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        post_owner_id,
        'post_comment',
        'تعليق جديد 💬',
        commenter_name || ' علق على منشورك: ' || LEFT(NEW.content, 30),
        jsonb_build_object(
            'post_id', NEW.post_id,
            'comment_id', NEW.id,
            'commenter_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for post comments
DROP TRIGGER IF EXISTS notify_on_post_comment ON public.post_comments;
CREATE TRIGGER notify_on_post_comment
AFTER INSERT ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.notify_post_comment();

-- ============================================================

-- 3. إشعار عند الإعجاب بتعليق (على المنشورات)
CREATE OR REPLACE FUNCTION public.notify_post_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    comment_owner_id UUID;
    liker_name TEXT;
    comment_preview TEXT;
    comment_post_id UUID;
BEGIN
    -- First check if this is for post_comment_likes table (we need to create it)
    -- For now, we'll handle trade comment likes enhancement
    RETURN NEW;
END;
$$;

-- ============================================================

-- 4. تحسين إشعار الإعجاب بتعليقات الصفقات
CREATE OR REPLACE FUNCTION public.notify_trade_comment_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    comment_owner_id UUID;
    liker_name TEXT;
    trade_id UUID;
BEGIN
    -- Get comment owner and trade
    SELECT user_id, trade_comments.trade_id INTO comment_owner_id, trade_id
    FROM public.trade_comments WHERE id = NEW.comment_id;
    
    -- Don't notify if liking own comment
    IF comment_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get liker display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        comment_owner_id,
        'comment_like',
        'إعجاب بتعليقك ❤️',
        liker_name || ' أعجب بتعليقك',
        jsonb_build_object(
            'trade_id', trade_id,
            'comment_id', NEW.comment_id,
            'liker_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for trade comment likes
DROP TRIGGER IF EXISTS notify_on_trade_comment_like ON public.trade_comment_likes;
CREATE TRIGGER notify_on_trade_comment_like
AFTER INSERT ON public.trade_comment_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_trade_comment_like();

-- ============================================================

-- 5. إشعار عند الإعجاب برد في المجتمع
CREATE OR REPLACE FUNCTION public.notify_reply_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    reply_owner_id UUID;
    liker_name TEXT;
    thread_id UUID;
BEGIN
    -- Get reply owner and thread
    SELECT user_id, replies.thread_id INTO reply_owner_id, thread_id
    FROM public.replies WHERE id = NEW.reply_id;
    
    -- Don't notify if liking own reply
    IF reply_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get liker display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        reply_owner_id,
        'reply_like',
        'إعجاب بردك ❤️',
        liker_name || ' أعجب بردك',
        jsonb_build_object(
            'thread_id', thread_id,
            'reply_id', NEW.reply_id,
            'liker_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for reply likes
DROP TRIGGER IF EXISTS notify_on_reply_like ON public.reply_likes;
CREATE TRIGGER notify_on_reply_like
AFTER INSERT ON public.reply_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_reply_like();

-- ============================================================

-- 6. إشعار عند الإعجاب بتحليل
CREATE OR REPLACE FUNCTION public.notify_analysis_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    analysis_owner_id UUID;
    liker_name TEXT;
    analysis_title TEXT;
BEGIN
    -- Get analysis owner
    SELECT created_by, title INTO analysis_owner_id, analysis_title
    FROM public.analyses WHERE id = NEW.analysis_id;
    
    -- Don't notify if liking own analysis or no owner
    IF analysis_owner_id IS NULL OR analysis_owner_id = NEW.user_id THEN
        RETURN NEW;
    END IF;
    
    -- Get liker display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO liker_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Create notification
    INSERT INTO public.user_notifications (user_id, type, title, message, data)
    VALUES (
        analysis_owner_id,
        'analysis_like',
        'إعجاب بتحليلك 📊',
        liker_name || ' أعجب بتحليلك: ' || LEFT(analysis_title, 30),
        jsonb_build_object(
            'analysis_id', NEW.analysis_id,
            'liker_id', NEW.user_id
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for analysis likes
DROP TRIGGER IF EXISTS notify_on_analysis_like ON public.analysis_likes;
CREATE TRIGGER notify_on_analysis_like
AFTER INSERT ON public.analysis_likes
FOR EACH ROW
EXECUTE FUNCTION public.notify_analysis_like();