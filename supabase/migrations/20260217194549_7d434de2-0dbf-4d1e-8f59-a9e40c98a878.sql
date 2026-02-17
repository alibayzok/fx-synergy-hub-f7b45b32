
-- Add image_url column to room_messages
ALTER TABLE public.room_messages ADD COLUMN image_url TEXT DEFAULT NULL;

-- Create storage bucket for room message images
INSERT INTO storage.buckets (id, name, public) VALUES ('room-images', 'room-images', true);

-- Storage policies for room-images bucket
CREATE POLICY "Room images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'room-images');

CREATE POLICY "Admins and moderators can upload room images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'room-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Admins and moderators can delete room images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'room-images' 
  AND auth.uid() IS NOT NULL
);
