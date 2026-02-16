
-- 1. Update process_referral to record referral as 'pending' without awarding points
CREATE OR REPLACE FUNCTION public.process_referral(
  p_referral_code TEXT,
  p_referred_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id UUID;
BEGIN
  -- Find referrer by code
  SELECT user_id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referral_code
  AND user_id != p_referred_user_id;

  IF v_referrer_id IS NULL THEN
    RETURN;
  END IF;

  -- Check if already referred
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_user_id) THEN
    RETURN;
  END IF;

  -- Record referral as pending (no points yet)
  INSERT INTO referrals (referrer_id, referred_id, referral_code, points_awarded, status)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 0, 'pending');
END;
$$;

-- 2. Create trigger function to award referral points when referred user passes KYC
CREATE OR REPLACE FUNCTION public.award_referral_on_kyc_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referral RECORD;
BEGIN
  -- Only trigger when kyc_status changes to 'approved'
  IF NEW.kyc_status = 'approved' AND (OLD.kyc_status IS DISTINCT FROM 'approved') THEN
    -- Find pending referral for this user
    SELECT * INTO v_referral
    FROM referrals
    WHERE referred_id = NEW.user_id
    AND status = 'pending'
    LIMIT 1;

    IF v_referral IS NOT NULL THEN
      -- Update referral to completed with points
      UPDATE referrals
      SET points_awarded = 50, status = 'completed'
      WHERE id = v_referral.id;

      -- Award points to referrer
      PERFORM add_user_points(
        v_referral.referrer_id,
        50,
        'referral',
        'نقاط إحالة صديق (بعد التوثيق)',
        'Referral bonus (after verification)',
        NEW.user_id::text
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Create the trigger on profiles table
DROP TRIGGER IF EXISTS trigger_award_referral_on_kyc ON public.profiles;
CREATE TRIGGER trigger_award_referral_on_kyc
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.award_referral_on_kyc_approval();
