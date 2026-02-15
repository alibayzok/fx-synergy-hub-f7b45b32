-- Add referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- Generate referral codes for existing profiles
UPDATE public.profiles 
SET referral_code = UPPER(SUBSTRING(md5(user_id::text || id::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Create trigger to auto-generate referral code on new profile
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(md5(NEW.user_id::text || gen_random_uuid()::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create signal_updates table for replies/updates to signals and analyses
CREATE TABLE public.signal_updates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_id UUID NOT NULL,
  parent_type TEXT NOT NULL CHECK (parent_type IN ('signal', 'analysis')),
  content TEXT NOT NULL,
  attachments TEXT[] DEFAULT '{}'::TEXT[],
  created_by UUID,
  telegram_message_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.signal_updates ENABLE ROW LEVEL SECURITY;

-- Everyone can view updates (same access as parent)
CREATE POLICY "Anyone authenticated can view updates"
ON public.signal_updates FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage updates
CREATE POLICY "Admins can manage updates"
ON public.signal_updates FOR ALL
USING (is_admin());

-- Enable realtime for updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.signal_updates;