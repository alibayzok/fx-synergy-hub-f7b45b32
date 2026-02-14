
ALTER TABLE public.services 
  ADD COLUMN card_type text DEFAULT 'default',
  ADD COLUMN app_store_url text,
  ADD COLUMN play_store_url text,
  ADD COLUMN apk_url text;
