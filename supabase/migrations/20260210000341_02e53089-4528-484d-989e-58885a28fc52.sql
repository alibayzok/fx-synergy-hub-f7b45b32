
-- Create course level enum
CREATE TYPE public.course_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- Categories table
CREATE TABLE public.learning_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  color TEXT NOT NULL DEFAULT 'blue',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Courses table
CREATE TABLE public.learning_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.learning_categories(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'BookOpen',
  level public.course_level NOT NULL DEFAULT 'beginner',
  is_vip BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Lessons table
CREATE TABLE public.learning_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.learning_courses(id) ON DELETE CASCADE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL DEFAULT '',
  content_en TEXT NOT NULL DEFAULT '',
  duration_minutes INT NOT NULL DEFAULT 5,
  sort_order INT NOT NULL DEFAULT 0,
  is_vip BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.learning_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_lessons ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone authenticated can read active categories
CREATE POLICY "Authenticated users can view active categories"
ON public.learning_categories FOR SELECT
USING (auth.uid() IS NOT NULL AND is_active = true);

-- RLS: Admins can do everything on categories
CREATE POLICY "Admins can manage categories"
ON public.learning_categories FOR ALL
USING (public.is_admin());

-- RLS: Anyone authenticated can view published courses
CREATE POLICY "Authenticated users can view published courses"
ON public.learning_courses FOR SELECT
USING (auth.uid() IS NOT NULL AND is_published = true);

-- RLS: Admins can do everything on courses
CREATE POLICY "Admins can manage courses"
ON public.learning_courses FOR ALL
USING (public.is_admin());

-- RLS: Anyone authenticated can view published lessons
CREATE POLICY "Authenticated users can view published lessons"
ON public.learning_lessons FOR SELECT
USING (auth.uid() IS NOT NULL AND is_published = true);

-- RLS: Admins can do everything on lessons
CREATE POLICY "Admins can manage lessons"
ON public.learning_lessons FOR ALL
USING (public.is_admin());

-- Enable realtime for lessons (for live updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.learning_lessons;

-- Timestamp trigger for categories
CREATE TRIGGER update_learning_categories_updated_at
BEFORE UPDATE ON public.learning_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Timestamp trigger for courses
CREATE TRIGGER update_learning_courses_updated_at
BEFORE UPDATE ON public.learning_courses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Timestamp trigger for lessons
CREATE TRIGGER update_learning_lessons_updated_at
BEFORE UPDATE ON public.learning_lessons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed initial categories
INSERT INTO public.learning_categories (title_ar, title_en, icon, color, sort_order) VALUES
('أساسيات التداول', 'Trading Basics', 'BookOpen', 'blue', 1),
('التحليل الفني', 'Technical Analysis', 'CandlestickChart', 'emerald', 2),
('التحليل الأساسي', 'Fundamental Analysis', 'BarChart3', 'amber', 3),
('إدارة المخاطر', 'Risk Management', 'Shield', 'red', 4),
('سيكولوجية التداول', 'Trading Psychology', 'Zap', 'purple', 5),
('استراتيجيات متقدمة', 'Advanced Strategies', 'Target', 'primary', 6);
