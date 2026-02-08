-- Allow authenticated users to view public profile information of other users
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive policy that only allows users to see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;