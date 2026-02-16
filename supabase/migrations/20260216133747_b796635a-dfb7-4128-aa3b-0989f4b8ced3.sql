
-- Add verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS phone_verified boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'none';

-- Create verification_requests table
CREATE TABLE public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_type text NOT NULL DEFAULT 'id_card',
  document_front_url text NOT NULL,
  document_back_url text,
  selfie_url text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification requests"
ON public.verification_requests FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can submit verification requests"
ON public.verification_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update verification requests"
ON public.verification_requests FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Admins can delete verification requests"
ON public.verification_requests FOR DELETE
USING (public.is_admin());

-- Security definer functions
CREATE OR REPLACE FUNCTION public.toggle_user_verification(p_user_id uuid, p_verified boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can toggle verification'; END IF;
  UPDATE public.profiles SET is_verified = p_verified WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_user_phone(p_user_id uuid, p_verified boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can verify phone'; END IF;
  UPDATE public.profiles SET phone_verified = p_verified WHERE user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_kyc_status(p_user_id uuid, p_status text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Only admins can update KYC status'; END IF;
  UPDATE public.profiles SET kyc_status = p_status WHERE user_id = p_user_id;
END;
$$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-documents', 'kyc-documents', false);

CREATE POLICY "Users can upload own KYC documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own KYC documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'kyc-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin()));

CREATE POLICY "Admins can manage KYC documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'kyc-documents' AND public.is_admin());

-- Recreate views with new columns
DROP VIEW IF EXISTS public.profiles_admin_view;
CREATE VIEW public.profiles_admin_view AS
SELECT id, user_id, first_name, last_name, display_name, username, avatar_url, 
       phone, country, language, onboarding_completed, trading_preferences,
       is_verified, phone_verified, kyc_status,
       created_at, updated_at
FROM public.profiles;

DROP VIEW IF EXISTS public.profiles_public;
CREATE VIEW public.profiles_public AS
SELECT id, user_id, first_name, last_name, display_name, username, avatar_url, 
       country, language, is_verified, created_at, updated_at
FROM public.profiles;
