-- Fix 1: Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Fix 2: Make the profiles SELECT policy more restrictive by recreating it
-- First drop the existing policy
DROP POLICY IF EXISTS "Users can view own profile or admin can view all" ON public.profiles;

-- Recreate with stricter conditions - users can ONLY view their own profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Separate admin policy for viewing all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

-- Fix 3: Verify and strengthen the can_access_trade function
-- Recreate with explicit null handling and stricter checks
CREATE OR REPLACE FUNCTION public.can_access_trade(trade_visibility trade_visibility)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        CASE 
            -- Admins can access all trades
            WHEN public.is_admin() THEN true
            -- Free trades are accessible to all authenticated users
            WHEN trade_visibility = 'free' AND auth.uid() IS NOT NULL THEN true
            -- VIP trades require VIP or admin role
            WHEN trade_visibility = 'vip' AND public.is_vip() THEN true
            -- Deny access by default
            ELSE false
        END
$$;