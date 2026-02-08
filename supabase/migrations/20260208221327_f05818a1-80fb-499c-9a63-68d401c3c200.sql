-- Create storage bucket for analysis attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('analysis-attachments', 'analysis-attachments', true);

-- Allow authenticated users to view attachments
CREATE POLICY "Anyone can view analysis attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'analysis-attachments');

-- Allow admins to upload attachments
CREATE POLICY "Admins can upload analysis attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'analysis-attachments' 
  AND public.is_admin()
);

-- Allow admins to update attachments
CREATE POLICY "Admins can update analysis attachments"
ON storage.objects FOR UPDATE
USING (bucket_id = 'analysis-attachments' AND public.is_admin());

-- Allow admins to delete attachments
CREATE POLICY "Admins can delete analysis attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'analysis-attachments' AND public.is_admin());