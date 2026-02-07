-- Create admin notifications table
CREATE TABLE public.admin_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL, -- 'new_user', 'milestone', 'trade_created', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only admins can view notifications
CREATE POLICY "Only admins can view notifications"
ON public.admin_notifications FOR SELECT
TO authenticated
USING (public.is_admin());

-- Only admins can update (mark as read)
CREATE POLICY "Only admins can update notifications"
ON public.admin_notifications FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Only admins can delete notifications
CREATE POLICY "Only admins can delete notifications"
ON public.admin_notifications FOR DELETE
TO authenticated
USING (public.is_admin());

-- System can insert (via triggers with SECURITY DEFINER)
CREATE POLICY "System can insert notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;

-- Create function to notify admin on new user registration
CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_count INTEGER;
    milestone INTEGER;
BEGIN
    -- Insert notification for new user
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'new_user',
        'مستخدم جديد',
        'انضم ' || COALESCE(NEW.display_name, 'مستخدم جديد') || ' إلى المنصة',
        jsonb_build_object(
            'user_id', NEW.user_id,
            'display_name', NEW.display_name,
            'country', NEW.country
        )
    );

    -- Check for milestones
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Define milestones
    milestone := CASE
        WHEN user_count = 10 THEN 10
        WHEN user_count = 25 THEN 25
        WHEN user_count = 50 THEN 50
        WHEN user_count = 100 THEN 100
        WHEN user_count = 250 THEN 250
        WHEN user_count = 500 THEN 500
        WHEN user_count = 1000 THEN 1000
        WHEN user_count = 5000 THEN 5000
        WHEN user_count = 10000 THEN 10000
        ELSE NULL
    END;

    -- Insert milestone notification if reached
    IF milestone IS NOT NULL THEN
        INSERT INTO public.admin_notifications (type, title, message, data)
        VALUES (
            'milestone',
            '🎉 إنجاز جديد!',
            'تهانينا! وصل عدد المستخدمين إلى ' || milestone || ' مستخدم',
            jsonb_build_object('milestone', milestone, 'total_users', user_count)
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Create trigger for new user notification
CREATE TRIGGER on_new_user_notify_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_user();

-- Create function to notify admin on new trade
CREATE OR REPLACE FUNCTION public.notify_admin_new_trade()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'trade_created',
        'صفقة جديدة',
        'تم إنشاء صفقة ' || NEW.direction || ' على ' || NEW.symbol,
        jsonb_build_object(
            'trade_id', NEW.id,
            'symbol', NEW.symbol,
            'direction', NEW.direction,
            'visibility', NEW.visibility
        )
    );
    RETURN NEW;
END;
$$;

-- Create trigger for new trade notification
CREATE TRIGGER on_new_trade_notify_admin
AFTER INSERT ON public.trades
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_new_trade();