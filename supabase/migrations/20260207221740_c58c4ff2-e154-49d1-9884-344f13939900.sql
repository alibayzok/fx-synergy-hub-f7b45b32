-- Drop the security definer view and recreate with security_invoker = true
DROP VIEW IF EXISTS public.profiles_admin_view;

-- Recreate the view with SECURITY INVOKER (default, but explicit)
CREATE VIEW public.profiles_admin_view 
WITH (security_invoker = true)
AS
SELECT 
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    language,
    first_name,
    last_name,
    country,
    public.mask_phone_number(phone) as phone,
    created_at,
    updated_at
FROM public.profiles;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.profiles_admin_view TO authenticated;

-- Add RLS policy on the view to restrict to admins only
-- Since the view uses security_invoker, it will respect the caller's permissions
-- We need to add back the admin policy on profiles table for this view to work
CREATE POLICY "Admins can view all profiles via view"
ON public.profiles
FOR SELECT
USING (public.is_admin());

COMMENT ON VIEW public.profiles_admin_view IS 'Secure view for admin access to profiles with masked phone numbers. Uses security_invoker to enforce RLS policies.';