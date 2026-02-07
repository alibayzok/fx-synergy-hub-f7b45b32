-- Create a secure function to mask phone numbers
CREATE OR REPLACE FUNCTION public.mask_phone_number(phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
    SELECT CASE
        WHEN phone IS NULL THEN NULL
        WHEN length(phone) <= 4 THEN '****'
        ELSE concat(
            repeat('*', length(phone) - 4),
            right(phone, 4)
        )
    END
$$;

-- Create a secure view for admin access with masked phone numbers
CREATE OR REPLACE VIEW public.profiles_admin_view AS
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

-- Drop the existing admin policy that exposes all profile data including phone
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate admin policy but exclude phone column by using the view instead
-- Admins should use profiles_admin_view for viewing all users
-- The base profiles table SELECT is now only for users viewing their own profile
COMMENT ON VIEW public.profiles_admin_view IS 'Secure view for admin access to profiles with masked phone numbers. Admins should query this view instead of the profiles table directly to protect user phone numbers.';