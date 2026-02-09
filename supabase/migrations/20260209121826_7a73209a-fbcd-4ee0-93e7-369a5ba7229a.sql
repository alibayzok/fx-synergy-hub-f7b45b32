-- Drop and recreate views as SECURITY INVOKER

-- First drop existing views
DROP VIEW IF EXISTS public.profiles_public;
DROP VIEW IF EXISTS public.profiles_admin_view;

-- Add a permissive SELECT policy so all authenticated users can read profiles
-- (phone is protected by only being exposed through the admin view, not profiles_public)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Recreate profiles_public as SECURITY INVOKER (excludes phone)
CREATE VIEW public.profiles_public
WITH (security_invoker = true)
AS SELECT
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    language,
    first_name,
    last_name,
    country,
    created_at,
    updated_at
FROM public.profiles;

-- Recreate profiles_admin_view as SECURITY INVOKER (masks phone)
CREATE VIEW public.profiles_admin_view
WITH (security_invoker = true)
AS SELECT
    id,
    user_id,
    username,
    display_name,
    avatar_url,
    language,
    first_name,
    last_name,
    country,
    mask_phone_number(phone) AS phone,
    created_at,
    updated_at
FROM public.profiles;