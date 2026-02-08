-- Create function to notify trade followers when a comment is added
CREATE OR REPLACE FUNCTION public.notify_trade_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    follower_record RECORD;
    commenter_name TEXT;
    trade_symbol TEXT;
BEGIN
    -- Get commenter name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO commenter_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Get trade symbol
    SELECT symbol INTO trade_symbol
    FROM public.trades WHERE id = NEW.trade_id;
    
    -- Notify all trade followers except the commenter
    FOR follower_record IN 
        SELECT user_id 
        FROM public.trade_followers 
        WHERE trade_id = NEW.trade_id AND user_id != NEW.user_id
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            follower_record.user_id,
            'trade_comment',
            'تعليق جديد على صفقة 💬',
            commenter_name || ' علق على صفقة ' || trade_symbol,
            jsonb_build_object(
                'trade_id', NEW.trade_id,
                'comment_id', NEW.id,
                'commenter_id', NEW.user_id
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for trade comments
DROP TRIGGER IF EXISTS trigger_notify_trade_comment ON public.trade_comments;
CREATE TRIGGER trigger_notify_trade_comment
    AFTER INSERT ON public.trade_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_trade_comment();