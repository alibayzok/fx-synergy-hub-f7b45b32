
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Add policy: users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = user_id);

-- Create a public view WITHOUT phone for social features
-- security_invoker defaults to off, so the view bypasses RLS on the base table
CREATE OR REPLACE VIEW public.profiles_public AS
SELECT id, user_id, username, display_name, avatar_url, language, first_name, last_name, country, created_at, updated_at
FROM public.profiles;
