-- Create a function to handle VIP subscription requests
-- This runs as SECURITY DEFINER so regular users can trigger admin notifications
CREATE OR REPLACE FUNCTION public.request_vip_subscription(p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_display_name TEXT;
  user_email TEXT;
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get user info
  SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
  FROM public.profiles WHERE user_id = auth.uid();

  SELECT email INTO user_email
  FROM auth.users WHERE id = auth.uid();

  -- Create admin notification
  INSERT INTO public.admin_notifications (type, title, message, data)
  VALUES (
    'vip_request',
    'طلب اشتراك VIP 👑',
    user_display_name || ' يطلب اشتراك VIP - باقة ' || CASE WHEN p_plan = 'monthly' THEN 'شهرية' ELSE 'سنوية' END,
    jsonb_build_object(
      'user_id', auth.uid(),
      'plan', p_plan,
      'email', user_email
    )
  );
END;
$$;