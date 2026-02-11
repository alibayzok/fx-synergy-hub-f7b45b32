
-- Create VIP subscriptions table
CREATE TABLE public.vip_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'rejected')),
  starts_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
ON public.vip_subscriptions
FOR SELECT
USING (auth.uid() = user_id OR is_admin());

-- Only admins can insert subscriptions
CREATE POLICY "Admins can insert subscriptions"
ON public.vip_subscriptions
FOR INSERT
WITH CHECK (is_admin());

-- Only admins can update subscriptions
CREATE POLICY "Admins can update subscriptions"
ON public.vip_subscriptions
FOR UPDATE
USING (is_admin());

-- Only admins can delete subscriptions
CREATE POLICY "Admins can delete subscriptions"
ON public.vip_subscriptions
FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_vip_subscriptions_updated_at
BEFORE UPDATE ON public.vip_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to activate VIP subscription (adds role + updates subscription)
CREATE OR REPLACE FUNCTION public.activate_vip_subscription(
  p_subscription_id UUID,
  p_duration_days INTEGER DEFAULT 30
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can activate subscriptions';
  END IF;

  -- Get user_id from subscription
  SELECT user_id INTO v_user_id
  FROM public.vip_subscriptions
  WHERE id = p_subscription_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Update subscription status
  UPDATE public.vip_subscriptions
  SET status = 'active',
      starts_at = now(),
      expires_at = now() + (p_duration_days || ' days')::interval,
      approved_by = auth.uid(),
      approved_at = now()
  WHERE id = p_subscription_id;

  -- Add VIP role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, 'vip')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Notify user
  INSERT INTO public.user_notifications (user_id, type, title, message, data)
  VALUES (
    v_user_id,
    'vip_activated',
    'تم تفعيل اشتراك VIP 👑',
    'مبروك! تم تفعيل اشتراكك VIP لمدة ' || p_duration_days || ' يوم',
    jsonb_build_object('subscription_id', p_subscription_id, 'expires_at', now() + (p_duration_days || ' days')::interval)
  );
END;
$$;

-- Function to deactivate/expire VIP subscription
CREATE OR REPLACE FUNCTION public.deactivate_vip_subscription(p_subscription_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_has_other_active BOOLEAN;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can deactivate subscriptions';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.vip_subscriptions
  WHERE id = p_subscription_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Subscription not found';
  END IF;

  -- Update subscription
  UPDATE public.vip_subscriptions
  SET status = 'expired'
  WHERE id = p_subscription_id;

  -- Check if user has other active subscriptions
  SELECT EXISTS (
    SELECT 1 FROM public.vip_subscriptions
    WHERE user_id = v_user_id AND status = 'active' AND id != p_subscription_id
  ) INTO v_has_other_active;

  -- Remove VIP role only if no other active subscriptions
  IF NOT v_has_other_active THEN
    DELETE FROM public.user_roles
    WHERE user_id = v_user_id AND role = 'vip';
  END IF;

  -- Notify user
  INSERT INTO public.user_notifications (user_id, type, title, message, data)
  VALUES (
    v_user_id,
    'vip_expired',
    'انتهى اشتراك VIP',
    'انتهى اشتراكك VIP. يمكنك تجديده من صفحة الاشتراكات',
    jsonb_build_object('subscription_id', p_subscription_id)
  );
END;
$$;

-- Function to reject VIP request
CREATE OR REPLACE FUNCTION public.reject_vip_subscription(p_subscription_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can reject subscriptions';
  END IF;

  SELECT user_id INTO v_user_id
  FROM public.vip_subscriptions
  WHERE id = p_subscription_id;

  UPDATE public.vip_subscriptions
  SET status = 'rejected',
      admin_notes = COALESCE(p_reason, admin_notes),
      approved_by = auth.uid(),
      approved_at = now()
  WHERE id = p_subscription_id;

  INSERT INTO public.user_notifications (user_id, type, title, message, data)
  VALUES (
    v_user_id,
    'vip_rejected',
    'تم رفض طلب VIP',
    'للأسف تم رفض طلب اشتراكك VIP' || CASE WHEN p_reason IS NOT NULL THEN '. السبب: ' || p_reason ELSE '' END,
    jsonb_build_object('subscription_id', p_subscription_id)
  );
END;
$$;

-- Update request_vip_subscription to also create a subscription record
CREATE OR REPLACE FUNCTION public.request_vip_subscription(p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_display_name TEXT;
  user_email TEXT;
  v_sub_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
  FROM public.profiles WHERE user_id = auth.uid();

  SELECT email INTO user_email
  FROM auth.users WHERE id = auth.uid();

  -- Create subscription record
  INSERT INTO public.vip_subscriptions (user_id, plan, status)
  VALUES (auth.uid(), p_plan, 'pending')
  RETURNING id INTO v_sub_id;

  -- Create admin notification
  INSERT INTO public.admin_notifications (type, title, message, data)
  VALUES (
    'vip_request',
    'طلب اشتراك VIP 👑',
    user_display_name || ' يطلب اشتراك VIP - باقة ' || CASE WHEN p_plan = 'monthly' THEN 'شهرية' ELSE p_plan END,
    jsonb_build_object(
      'user_id', auth.uid(),
      'plan', p_plan,
      'email', user_email,
      'subscription_id', v_sub_id
    )
  );
END;
$$;

-- Enable realtime for vip_subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.vip_subscriptions;
