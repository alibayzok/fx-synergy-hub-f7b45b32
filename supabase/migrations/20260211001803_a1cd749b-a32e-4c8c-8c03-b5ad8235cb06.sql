
-- Create storage bucket for CMS assets
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-assets', 'cms-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view CMS assets
CREATE POLICY "CMS assets are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'cms-assets');

-- Only admins can upload CMS assets
CREATE POLICY "Admins can upload CMS assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cms-assets' AND public.is_admin());

-- Only admins can update CMS assets
CREATE POLICY "Admins can update CMS assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cms-assets' AND public.is_admin());

-- Only admins can delete CMS assets
CREATE POLICY "Admins can delete CMS assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'cms-assets' AND public.is_admin());

-- Add image settings to app_settings
INSERT INTO public.app_settings (category, setting_key, setting_value, setting_type, label_ar, label_en, description_ar, sort_order)
VALUES
  ('images', 'logo_url', '', 'image', 'شعار التطبيق', 'App Logo', 'الشعار الذي يظهر في الصفحة الرئيسية وشاشة البداية', 1),
  ('images', 'logo_dark_url', '', 'image', 'شعار التطبيق (الوضع الداكن)', 'App Logo (Dark)', 'شعار مخصص للوضع الداكن', 2),
  ('images', 'hero_bg_url', '', 'image', 'صورة خلفية الصفحة الرئيسية', 'Hero Background', 'صورة الخلفية في أعلى الصفحة الرئيسية', 3),
  ('images', 'splash_bg_url', '', 'image', 'صورة خلفية شاشة البداية', 'Splash Background', 'صورة خلفية تظهر عند فتح التطبيق', 4),
  ('images', 'auth_bg_url', '', 'image', 'صورة خلفية صفحة تسجيل الدخول', 'Auth Background', 'صورة خلفية لصفحة تسجيل الدخول', 5),
  ('images', 'favicon_url', '', 'image', 'أيقونة التطبيق (Favicon)', 'Favicon', 'الأيقونة الصغيرة التي تظهر في تبويب المتصفح', 6);
