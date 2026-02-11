
-- Create a new visibility enum for content
CREATE TYPE public.content_visibility AS ENUM ('free', 'vip');

-- Re-add visibility column to analyses
ALTER TABLE public.analyses ADD COLUMN visibility public.content_visibility NOT NULL DEFAULT 'free';

-- Recreate access function for the new enum
CREATE OR REPLACE FUNCTION public.can_access_content(content_vis public.content_visibility)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT 
        CASE 
            WHEN public.is_admin() THEN true
            WHEN content_vis = 'free' AND auth.uid() IS NOT NULL THEN true
            WHEN content_vis = 'vip' AND public.is_vip() THEN true
            ELSE false
        END
$$;

-- Drop old analyses RLS policy that referenced can_access_trade
DROP POLICY IF EXISTS "Users can view analyses based on visibility" ON public.analyses;

-- Recreate with new function
CREATE POLICY "Users can view analyses based on visibility"
ON public.analyses
FOR SELECT
USING (can_access_content(visibility));
