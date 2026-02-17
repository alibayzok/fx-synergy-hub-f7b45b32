
-- Add telegram_message_id to signals table for linking replies
ALTER TABLE public.signals ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_signals_telegram_message_id ON public.signals (telegram_message_id) WHERE telegram_message_id IS NOT NULL;

-- Add telegram_message_id to articles table too
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;

-- Create storage bucket for telegram images
INSERT INTO storage.buckets (id, name, public) VALUES ('telegram-images', 'telegram-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for telegram-images bucket
CREATE POLICY "Telegram images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'telegram-images');

CREATE POLICY "Service role can upload telegram images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'telegram-images');
