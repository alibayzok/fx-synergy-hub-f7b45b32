-- Make support-attachments bucket public so signed URLs are not needed
UPDATE storage.buckets SET public = true WHERE id = 'support-attachments';

-- Drop old restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view support attachments" ON storage.objects;

-- Create public read policy for support attachments
CREATE POLICY "Anyone can view support attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'support-attachments');