
-- Create articles table for admin-written articles
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL DEFAULT '',
  summary_ar TEXT DEFAULT '',
  summary_en TEXT DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  image_url TEXT DEFAULT '',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read published articles
CREATE POLICY "Anyone can read published articles"
  ON public.articles FOR SELECT
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "Admins can manage articles"
  ON public.articles FOR ALL
  USING (public.is_admin());

-- Timestamp trigger
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
