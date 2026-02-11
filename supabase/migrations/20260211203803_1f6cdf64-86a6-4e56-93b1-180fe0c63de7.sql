
-- ============================================
-- GAMIFICATION SYSTEM
-- ============================================

-- Badges definition table
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏆',
  color text NOT NULL DEFAULT '#f59e0b',
  points_required integer NOT NULL DEFAULT 0,
  badge_type text NOT NULL DEFAULT 'milestone', -- milestone, achievement, special
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active badges" ON public.badges
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage badges" ON public.badges
  FOR ALL USING (is_admin());

-- User points summary
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total_points integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  level_name_ar text NOT NULL DEFAULT 'مبتدئ',
  level_name_en text NOT NULL DEFAULT 'Beginner',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all points" ON public.user_points
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System inserts points" ON public.user_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System updates points" ON public.user_points
  FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- Point transactions log
CREATE TABLE public.point_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  points integer NOT NULL,
  action_type text NOT NULL, -- 'room_message', 'post_created', 'post_liked', 'referral_signup', 'referral_vip', 'daily_login'
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  reference_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions" ON public.point_transactions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "System inserts transactions" ON public.point_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

-- User badges (earned)
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all earned badges" ON public.user_badges
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "System inserts badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());

-- Function to add points and update level
CREATE OR REPLACE FUNCTION public.add_user_points(
  p_user_id uuid,
  p_points integer,
  p_action_type text,
  p_description_ar text DEFAULT '',
  p_description_en text DEFAULT '',
  p_reference_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_level integer;
  v_level_ar text;
  v_level_en text;
BEGIN
  -- Insert transaction
  INSERT INTO public.point_transactions (user_id, points, action_type, description_ar, description_en, reference_id)
  VALUES (p_user_id, p_points, p_action_type, p_description_ar, p_description_en, p_reference_id);

  -- Upsert user_points
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (p_user_id, p_points)
  ON CONFLICT (user_id) DO UPDATE
  SET total_points = user_points.total_points + p_points,
      updated_at = now();

  -- Get new total
  SELECT total_points INTO v_total FROM public.user_points WHERE user_id = p_user_id;

  -- Calculate level
  v_level := CASE
    WHEN v_total >= 10000 THEN 10
    WHEN v_total >= 7500 THEN 9
    WHEN v_total >= 5000 THEN 8
    WHEN v_total >= 3500 THEN 7
    WHEN v_total >= 2500 THEN 6
    WHEN v_total >= 1500 THEN 5
    WHEN v_total >= 1000 THEN 4
    WHEN v_total >= 500 THEN 3
    WHEN v_total >= 200 THEN 2
    ELSE 1
  END;

  v_level_ar := CASE v_level
    WHEN 1 THEN 'مبتدئ'
    WHEN 2 THEN 'نشيط'
    WHEN 3 THEN 'متقدم'
    WHEN 4 THEN 'خبير'
    WHEN 5 THEN 'محترف'
    WHEN 6 THEN 'أسطوري'
    WHEN 7 THEN 'نخبة'
    WHEN 8 THEN 'قائد'
    WHEN 9 THEN 'بطل'
    WHEN 10 THEN 'أسطورة'
  END;

  v_level_en := CASE v_level
    WHEN 1 THEN 'Beginner'
    WHEN 2 THEN 'Active'
    WHEN 3 THEN 'Advanced'
    WHEN 4 THEN 'Expert'
    WHEN 5 THEN 'Pro'
    WHEN 6 THEN 'Legendary'
    WHEN 7 THEN 'Elite'
    WHEN 8 THEN 'Leader'
    WHEN 9 THEN 'Champion'
    WHEN 10 THEN 'Legend'
  END;

  UPDATE public.user_points
  SET level = v_level, level_name_ar = v_level_ar, level_name_en = v_level_en
  WHERE user_id = p_user_id;
END;
$$;

-- Trigger: award points on room message
CREATE OR REPLACE FUNCTION public.award_points_on_room_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.add_user_points(
    NEW.user_id, 2, 'room_message',
    'إرسال رسالة في الغرفة', 'Sent a room message',
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_room_message
AFTER INSERT ON public.room_messages
FOR EACH ROW EXECUTE FUNCTION public.award_points_on_room_message();

-- Trigger: award points on post creation
CREATE OR REPLACE FUNCTION public.award_points_on_post()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.add_user_points(
    NEW.user_id, 10, 'post_created',
    'نشر منشور جديد', 'Created a new post',
    NEW.id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_post
AFTER INSERT ON public.user_posts
FOR EACH ROW EXECUTE FUNCTION public.award_points_on_post();

-- Trigger: award points when post is liked (to the post owner)
CREATE OR REPLACE FUNCTION public.award_points_on_post_like()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_post_owner uuid;
BEGIN
  SELECT user_id INTO v_post_owner FROM public.user_posts WHERE id = NEW.post_id;
  IF v_post_owner IS NOT NULL AND v_post_owner != NEW.user_id THEN
    PERFORM public.add_user_points(
      v_post_owner, 3, 'post_liked',
      'حصل منشورك على إعجاب', 'Your post got a like',
      NEW.post_id::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_post_like
AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.award_points_on_post_like();

-- Insert default badges
INSERT INTO public.badges (name_ar, name_en, icon, color, points_required, badge_type, sort_order) VALUES
('المبتدئ', 'Newcomer', '🌱', '#22c55e', 0, 'milestone', 1),
('النشيط', 'Active Member', '⚡', '#3b82f6', 200, 'milestone', 2),
('المتفاعل', 'Engager', '💬', '#8b5cf6', 500, 'milestone', 3),
('الخبير', 'Expert', '🎯', '#f59e0b', 1000, 'milestone', 4),
('المحترف', 'Professional', '👑', '#ef4444', 2500, 'milestone', 5),
('الأسطورة', 'Legend', '🏆', '#eab308', 5000, 'milestone', 6),
('المُحيل', 'Referrer', '🤝', '#06b6d4', 0, 'achievement', 7),
('الناشر', 'Publisher', '📝', '#ec4899', 0, 'achievement', 8);

-- ============================================
-- LIVE SESSIONS SYSTEM
-- ============================================

CREATE TABLE public.live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  host_id uuid NOT NULL,
  stream_url text, -- YouTube Live / external embed URL
  thumbnail_url text,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, live, ended
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  is_vip boolean NOT NULL DEFAULT false,
  max_viewers integer DEFAULT 0,
  current_viewers integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view live sessions" ON public.live_sessions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage live sessions" ON public.live_sessions
  FOR ALL USING (is_admin());

-- Live session chat messages
CREATE TABLE public.live_session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.live_session_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view session messages" ON public.live_session_messages
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can send session messages" ON public.live_session_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage session messages" ON public.live_session_messages
  FOR ALL USING (is_admin());

CREATE POLICY "Users can delete own session messages" ON public.live_session_messages
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime for live chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_session_messages;
