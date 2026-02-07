-- Fix security issue: Restrict profile visibility to own profile or admin
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR public.is_admin());