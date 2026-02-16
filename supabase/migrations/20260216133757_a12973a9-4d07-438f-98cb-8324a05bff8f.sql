
-- Fix security definer views by setting them to SECURITY INVOKER
ALTER VIEW public.profiles_admin_view SET (security_invoker = on);
ALTER VIEW public.profiles_public SET (security_invoker = on);
