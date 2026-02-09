-- Add DELETE policy for flagged_content table (currently missing)
CREATE POLICY "Admins can delete flagged content"
ON public.flagged_content
FOR DELETE
USING (public.is_admin());

-- Create function to notify admins about flagged content
CREATE OR REPLACE FUNCTION public.notify_admin_flagged_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_display_name TEXT;
    content_type_ar TEXT;
BEGIN
    -- Get user display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Translate content type
    content_type_ar := CASE NEW.content_type
        WHEN 'post' THEN 'منشور'
        WHEN 'room_message' THEN 'رسالة'
        WHEN 'thread' THEN 'موضوع'
        WHEN 'reply' THEN 'رد'
        ELSE NEW.content_type
    END;
    
    -- Insert admin notification
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'flagged_content',
        '🚨 محتوى مخالف',
        'تم اكتشاف ' || content_type_ar || ' يحتوي على محتوى غير لائق من ' || user_display_name,
        jsonb_build_object(
            'flagged_id', NEW.id,
            'content_type', NEW.content_type,
            'content_id', NEW.content_id,
            'user_id', NEW.user_id,
            'reason', NEW.flag_reason,
            'confidence', NEW.confidence,
            'flagged_url', NEW.flagged_url
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to notify admins
DROP TRIGGER IF EXISTS notify_flagged_content_trigger ON public.flagged_content;
CREATE TRIGGER notify_flagged_content_trigger
AFTER INSERT ON public.flagged_content
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_flagged_content();