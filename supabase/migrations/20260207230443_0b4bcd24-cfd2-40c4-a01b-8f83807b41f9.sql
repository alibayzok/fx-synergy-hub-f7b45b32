-- Create enum for service types
CREATE TYPE public.service_type AS ENUM ('broker_deposit', 'broker_withdraw', 'usdt_buy', 'usdt_sell', 'broker_account');

-- Create enum for service status
CREATE TYPE public.service_status AS ENUM ('pending', 'in_progress', 'approved', 'rejected', 'completed');

-- Create service requests table
CREATE TABLE public.service_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type service_type NOT NULL,
    amount NUMERIC,
    network TEXT,
    status service_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view own service requests"
ON public.service_requests FOR SELECT
USING (auth.uid() = user_id OR is_admin());

-- Users can create requests
CREATE POLICY "Users can create service requests"
ON public.service_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only admins can update requests
CREATE POLICY "Only admins can update service requests"
ON public.service_requests FOR UPDATE
USING (is_admin());

-- Only admins can delete requests
CREATE POLICY "Only admins can delete service requests"
ON public.service_requests FOR DELETE
USING (is_admin());

-- Add trigger for updated_at
CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to notify admin on new service request
CREATE OR REPLACE FUNCTION public.notify_admin_new_service_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_display_name TEXT;
    request_title TEXT;
    request_message TEXT;
BEGIN
    -- Get user display name
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Set title and message based on request type
    CASE NEW.type
        WHEN 'broker_account' THEN
            request_title := 'طلب فتح حساب تداول';
            request_message := user_display_name || ' يطلب فتح حساب تداول جديد';
        WHEN 'broker_deposit' THEN
            request_title := 'طلب إيداع للوسيط';
            request_message := user_display_name || ' يطلب إيداع بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'broker_withdraw' THEN
            request_title := 'طلب سحب من الوسيط';
            request_message := user_display_name || ' يطلب سحب بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_buy' THEN
            request_title := 'طلب شراء USDT';
            request_message := user_display_name || ' يطلب شراء USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
        WHEN 'usdt_sell' THEN
            request_title := 'طلب بيع USDT';
            request_message := user_display_name || ' يطلب بيع USDT بقيمة $' || COALESCE(NEW.amount::TEXT, '0');
    END CASE;
    
    -- Insert admin notification
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'service_request',
        request_title,
        request_message,
        jsonb_build_object(
            'request_id', NEW.id,
            'user_id', NEW.user_id,
            'type', NEW.type,
            'amount', NEW.amount,
            'network', NEW.network
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger for admin notification
CREATE TRIGGER notify_admin_on_new_service_request
    AFTER INSERT ON public.service_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_admin_new_service_request();

-- Enable realtime for service_requests
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;