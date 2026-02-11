
-- Create app_settings table for CMS
CREATE TABLE public.app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    category text NOT NULL, -- 'general', 'colors', 'texts', 'links', 'images', 'features'
    setting_key text NOT NULL,
    setting_value text,
    setting_type text NOT NULL DEFAULT 'text', -- 'text', 'color', 'image', 'url', 'boolean', 'number', 'json'
    label_ar text NOT NULL,
    label_en text NOT NULL DEFAULT '',
    description_ar text,
    sort_order integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    updated_by uuid,
    UNIQUE(category, setting_key)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can view settings" ON public.app_settings
FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "Admins can insert settings" ON public.app_settings
FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update settings" ON public.app_settings
FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete settings" ON public.app_settings
FOR DELETE USING (is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;

-- Insert default settings
INSERT INTO public.app_settings (category, setting_key, setting_value, setting_type, label_ar, label_en, description_ar, sort_order) VALUES
-- General
('general', 'app_name', 'FX Assassin', 'text', 'اسم التطبيق', 'App Name', 'الاسم الذي يظهر في التطبيق', 1),
('general', 'app_description', 'منصة تداول احترافية', 'text', 'وصف التطبيق', 'App Description', 'وصف مختصر للتطبيق', 2),
('general', 'welcome_message', 'مرحباً بك في منصة التداول الاحترافية', 'text', 'رسالة الترحيب', 'Welcome Message', 'الرسالة التي تظهر في الصفحة الرئيسية', 3),
('general', 'maintenance_mode', 'false', 'boolean', 'وضع الصيانة', 'Maintenance Mode', 'تفعيل وضع الصيانة يمنع المستخدمين من الوصول', 4),
('general', 'maintenance_message', 'التطبيق تحت الصيانة، يرجى المحاولة لاحقاً', 'text', 'رسالة الصيانة', 'Maintenance Message', '', 5),

-- Links
('links', 'telegram_url', 'https://t.me/assaisn_syria_forex_signal', 'url', 'رابط تلغرام', 'Telegram URL', '', 1),
('links', 'facebook_url', 'https://www.facebook.com/share/1FRW6i4vUZ/', 'url', 'رابط فيسبوك', 'Facebook URL', '', 2),
('links', 'instagram_url', 'https://www.instagram.com/forex_assassin33', 'url', 'رابط انستاغرام', 'Instagram URL', '', 3),
('links', 'whatsapp_url', '', 'url', 'رابط واتساب', 'WhatsApp URL', '', 4),
('links', 'support_email', '', 'text', 'بريد الدعم', 'Support Email', '', 5),

-- Texts
('texts', 'home_hero_title', 'أهلاً بك في عالم التداول', 'text', 'عنوان الصفحة الرئيسية', 'Home Hero Title', '', 1),
('texts', 'home_hero_subtitle', 'تداول بذكاء مع فريق من المحترفين', 'text', 'العنوان الفرعي للرئيسية', 'Home Hero Subtitle', '', 2),
('texts', 'footer_text', '© جميع الحقوق محفوظة', 'text', 'نص أسفل الصفحة', 'Footer Text', '', 3),
('texts', 'about_text', '', 'text', 'نص حول التطبيق', 'About Text', '', 4),
('texts', 'terms_text', '', 'text', 'الشروط والأحكام', 'Terms Text', '', 5),

-- Features
('features', 'enable_usdt_service', 'true', 'boolean', 'خدمة USDT', 'USDT Service', 'تفعيل/تعطيل خدمة بيع وشراء USDT', 1),
('features', 'enable_broker_service', 'true', 'boolean', 'خدمة الوسيط', 'Broker Service', 'تفعيل/تعطيل خدمة فتح حسابات التداول', 2),
('features', 'enable_community', 'true', 'boolean', 'المجتمع', 'Community', 'تفعيل/تعطيل قسم المجتمع', 3),
('features', 'enable_ai_chat', 'true', 'boolean', 'الذكاء الاصطناعي', 'AI Chat', 'تفعيل/تعطيل مساعد الذكاء الاصطناعي', 4),
('features', 'enable_analyses', 'true', 'boolean', 'التحليلات', 'Analyses', 'تفعيل/تعطيل قسم التحليلات', 5),

-- Announcements
('announcements', 'banner_text', '', 'text', 'نص الإعلان', 'Banner Text', 'يظهر كشريط إعلاني أعلى التطبيق', 1),
('announcements', 'banner_active', 'false', 'boolean', 'تفعيل الإعلان', 'Banner Active', '', 2),
('announcements', 'banner_color', '#f59e0b', 'color', 'لون الإعلان', 'Banner Color', '', 3),
('announcements', 'popup_title', '', 'text', 'عنوان النافذة المنبثقة', 'Popup Title', '', 4),
('announcements', 'popup_message', '', 'text', 'رسالة النافذة المنبثقة', 'Popup Message', '', 5),
('announcements', 'popup_active', 'false', 'boolean', 'تفعيل النافذة المنبثقة', 'Popup Active', '', 6);
