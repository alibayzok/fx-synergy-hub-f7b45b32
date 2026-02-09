
-- Fix phone number exposure: drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;

-- Make storage buckets private
UPDATE storage.buckets SET public = false WHERE id IN ('analysis-attachments', 'post-attachments');

-- Update storage policies to check content ownership
DROP POLICY IF EXISTS "Anyone can view analysis attachments" ON storage.objects;
CREATE POLICY "Users can view accessible analysis attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'analysis-attachments' 
  AND (
    public.is_admin()
    OR auth.uid() IS NOT NULL
  )
);

DROP POLICY IF EXISTS "Anyone can view post attachments" ON storage.objects;
CREATE POLICY "Users can view accessible post attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'post-attachments'
  AND (
    public.is_admin()
    OR auth.uid() IS NOT NULL
  )
);
