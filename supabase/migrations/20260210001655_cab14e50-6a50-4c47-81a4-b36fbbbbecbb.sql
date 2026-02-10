
-- Create storage bucket for lesson videos
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-videos', 'lesson-videos', true);

-- Allow authenticated users to view videos
CREATE POLICY "Anyone can view lesson videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'lesson-videos');

-- Only admins can upload videos
CREATE POLICY "Admins can upload lesson videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'lesson-videos' 
  AND public.is_admin()
);

-- Only admins can update videos
CREATE POLICY "Admins can update lesson videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'lesson-videos' 
  AND public.is_admin()
);

-- Only admins can delete videos
CREATE POLICY "Admins can delete lesson videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'lesson-videos' 
  AND public.is_admin()
);
