-- Fix the overly permissive INSERT policy
-- Drop the old policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.admin_notifications;

-- The trigger functions use SECURITY DEFINER which bypasses RLS
-- So we don't need an INSERT policy for regular users at all
-- The triggers will handle all insertions

-- Create a more restrictive INSERT policy (only admins can manually insert if needed)
CREATE POLICY "Only admins can insert notifications"
ON public.admin_notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());