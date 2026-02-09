
-- Recreate admin view to include new columns and show full phone for admins
DROP VIEW IF EXISTS public.profiles_admin_view;
CREATE VIEW public.profiles_admin_view 
WITH (security_invoker = on) AS
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
    phone,
    onboarding_completed,
    trading_preferences,
    created_at,
    updated_at
FROM profiles;
