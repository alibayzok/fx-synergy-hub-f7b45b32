
-- Add category column to community_rooms
ALTER TABLE public.community_rooms ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'discussions';

-- Update existing rooms categories
UPDATE public.community_rooms SET category = 'channels' WHERE is_broadcast = true;
UPDATE public.community_rooms SET category = 'discussions' WHERE is_broadcast = false AND id NOT IN ('learning');
UPDATE public.community_rooms SET category = 'learning' WHERE id = 'learning';

-- Insert learning discussion room
INSERT INTO public.community_rooms (id, name, name_ar, description, description_ar, is_broadcast, is_private, icon, color, requires_approval, category)
VALUES ('learning-discussion', 'Learning Discussion', 'مناقشات التعلم', 'Discuss lessons, ask questions, and share knowledge', 'ناقش الدروس واطرح الأسئلة وشارك المعرفة', false, false, 'GraduationCap', 'green', true, 'learning')
ON CONFLICT (id) DO NOTHING;
