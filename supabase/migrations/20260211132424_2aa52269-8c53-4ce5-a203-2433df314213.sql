-- Create storage bucket for article images
INSERT INTO storage.buckets (id, name, public)
VALUES ('article-images', 'article-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Article images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Only admins can upload article images
CREATE POLICY "Admins can upload article images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'article-images' AND public.is_admin());

-- Only admins can update article images
CREATE POLICY "Admins can update article images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'article-images' AND public.is_admin());

-- Only admins can delete article images
CREATE POLICY "Admins can delete article images"
ON storage.objects FOR DELETE
USING (bucket_id = 'article-images' AND public.is_admin());