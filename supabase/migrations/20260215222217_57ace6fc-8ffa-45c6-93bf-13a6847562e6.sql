
-- Create signal-attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('signal-attachments', 'signal-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Signal attachments are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'signal-attachments');

-- Allow service role to upload (edge functions use service role)
CREATE POLICY "Service role can upload signal attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'signal-attachments');
