-- Allow authenticated users to view other users' profiles (needed for chat, user profile pages, etc.)
-- This policy enables the profiles_public view to work for all authenticated users
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);