
-- Fix overly permissive notification INSERT policies

-- user_notifications: restrict to self or admin
DROP POLICY IF EXISTS "System can create notifications" ON public.user_notifications;
CREATE POLICY "Users can insert own notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR is_admin());

-- admin_notifications: already has restrictive policy, drop the permissive one if it exists
-- Check existing: the table already has "Only admins can insert notifications" as a restrictive policy
-- But the scan shows "System can insert notifications" with WITH CHECK (true) — drop it
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;
