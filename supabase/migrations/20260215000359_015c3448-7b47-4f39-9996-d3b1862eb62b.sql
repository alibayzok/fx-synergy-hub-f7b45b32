
-- Fix analysis-attachments bucket to be public (images not loading)
UPDATE storage.buckets SET public = true WHERE id = 'analysis-attachments';

-- Also fix post-attachments bucket to be public
UPDATE storage.buckets SET public = true WHERE id = 'post-attachments';

-- Add storage policies for analysis-attachments (using IF NOT EXISTS pattern)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for analysis attachments' AND tablename = 'objects') THEN
    CREATE POLICY "Public read access for analysis attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'analysis-attachments');
  END IF;
END $$;

-- Add channel_url column to learning_courses for educational channel links
ALTER TABLE public.learning_courses ADD COLUMN IF NOT EXISTS channel_url text DEFAULT NULL;
