-- Create function to notify users about new trades
CREATE OR REPLACE FUNCTION public.notify_users_new_trade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    user_record RECORD;
    trade_type TEXT;
    can_view BOOLEAN;
BEGIN
    -- Set trade type text
    trade_type := CASE 
        WHEN NEW.direction = 'buy' THEN 'شراء'
        ELSE 'بيع'
    END;
    
    -- Notify all users who can view this trade
    FOR user_record IN 
        SELECT DISTINCT ur.user_id 
        FROM public.user_roles ur
        WHERE 
            -- For free trades, notify all users
            (NEW.visibility = 'free')
            OR
            -- For VIP trades, notify only VIP and admin users
            (NEW.visibility = 'vip' AND ur.role IN ('vip', 'admin'))
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            user_record.user_id,
            'new_trade',
            'صفقة جديدة 🔔',
            'صفقة ' || trade_type || ' على ' || NEW.symbol || ' - ' || NEW.timeframe,
            jsonb_build_object(
                'trade_id', NEW.id,
                'symbol', NEW.symbol,
                'direction', NEW.direction,
                'visibility', NEW.visibility,
                'entry_price', NEW.entry_price
            )
        );
    END LOOP;
    
    RETURN NEW;
END;
$function$;

-- Create trigger for new trades
DROP TRIGGER IF EXISTS trigger_notify_users_new_trade ON public.trades;
CREATE TRIGGER trigger_notify_users_new_trade
    AFTER INSERT ON public.trades
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_users_new_trade();