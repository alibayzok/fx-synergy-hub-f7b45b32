
-- Update RLS to protect API key settings from public view
-- Drop the existing public view policy
DROP POLICY IF EXISTS "Anyone can view settings" ON public.app_settings;

-- Create policy for non-secret settings (everyone can view)
CREATE POLICY "Anyone can view non-secret settings" 
ON public.app_settings 
FOR SELECT 
USING (setting_key NOT LIKE '%api_key%' AND setting_key NOT LIKE '%secret%');

-- Create policy for secret settings (admin only)
CREATE POLICY "Admins can view secret settings" 
ON public.app_settings 
FOR SELECT 
USING ((setting_key LIKE '%api_key%' OR setting_key LIKE '%secret%') AND is_admin());
