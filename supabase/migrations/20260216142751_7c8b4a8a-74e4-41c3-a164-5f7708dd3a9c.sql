
-- ═══════════════════════════════════════════
-- 1. Referrals tracking table
-- ═══════════════════════════════════════════
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  points_awarded INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

CREATE POLICY "Authenticated users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

CREATE POLICY "Admins can manage referrals" ON public.referrals
  FOR ALL USING (is_admin());

-- Index for fast lookup
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);

-- ═══════════════════════════════════════════
-- 2. Referral rewards catalog
-- ═══════════════════════════════════════════
CREATE TABLE public.referral_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🎁',
  points_cost INTEGER NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'custom',
  reward_value TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock INTEGER,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rewards" ON public.referral_rewards
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage rewards" ON public.referral_rewards
  FOR ALL USING (is_admin());

-- ═══════════════════════════════════════════
-- 3. Reward redemptions table
-- ═══════════════════════════════════════════
CREATE TYPE public.redemption_status AS ENUM ('pending', 'approved', 'rejected', 'delivered');

CREATE TABLE public.reward_redemptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  reward_id UUID REFERENCES public.referral_rewards(id),
  redemption_type TEXT NOT NULL DEFAULT 'catalog',
  points_spent INTEGER NOT NULL,
  status public.redemption_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions" ON public.reward_redemptions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create redemptions" ON public.reward_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update redemptions" ON public.reward_redemptions
  FOR UPDATE USING (is_admin());

CREATE POLICY "Admins can delete redemptions" ON public.reward_redemptions
  FOR DELETE USING (is_admin());

CREATE INDEX idx_redemptions_user ON public.reward_redemptions(user_id);
CREATE INDEX idx_redemptions_status ON public.reward_redemptions(status);

-- ═══════════════════════════════════════════
-- 4. Function to process referral on signup
-- ═══════════════════════════════════════════
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

  -- Record referral
  INSERT INTO referrals (referrer_id, referred_id, referral_code, points_awarded)
  VALUES (v_referrer_id, p_referred_user_id, p_referral_code, 50);

  -- Award points to referrer
  PERFORM add_user_points(
    v_referrer_id,
    50,
    'referral',
    'نقاط إحالة صديق',
    'Referral bonus',
    p_referred_user_id::text
  );
END;
$$;
