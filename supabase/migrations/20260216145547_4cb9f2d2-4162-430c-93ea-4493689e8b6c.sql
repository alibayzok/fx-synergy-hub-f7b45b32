
-- Update update_kyc_status to allow moderators
CREATE OR REPLACE FUNCTION public.update_kyc_status(p_user_id uuid, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_moderator() THEN RAISE EXCEPTION 'Only admins and moderators can update KYC status'; END IF;
  UPDATE public.profiles SET kyc_status = p_status WHERE user_id = p_user_id;
END;
$function$;

-- Update toggle_user_verification to allow moderators
CREATE OR REPLACE FUNCTION public.toggle_user_verification(p_user_id uuid, p_verified boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_moderator() THEN RAISE EXCEPTION 'Only admins and moderators can toggle verification'; END IF;
  UPDATE public.profiles SET is_verified = p_verified WHERE user_id = p_user_id;
END;
$function$;

-- Update verify_user_phone to allow moderators
CREATE OR REPLACE FUNCTION public.verify_user_phone(p_user_id uuid, p_verified boolean)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_moderator() THEN RAISE EXCEPTION 'Only admins and moderators can verify phone'; END IF;
  UPDATE public.profiles SET phone_verified = p_verified WHERE user_id = p_user_id;
END;
$function$;
