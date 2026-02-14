
-- Daily quest definitions (admin-configurable)
CREATE TABLE public.daily_quests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quest_key TEXT NOT NULL UNIQUE,
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_en TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT 'Star',
  target_count INT NOT NULL DEFAULT 1,
  points_reward INT NOT NULL DEFAULT 5,
  quest_type TEXT NOT NULL DEFAULT 'action',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.daily_quests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active quests" ON public.daily_quests FOR SELECT USING (true);

-- Insert default daily quests
INSERT INTO public.daily_quests (quest_key, title_ar, title_en, description_ar, description_en, icon, target_count, points_reward, sort_order) VALUES
  ('send_message', 'أرسل رسالة في غرفة', 'Send a room message', 'شارك في أي غرفة نقاش', 'Participate in any chat room', 'MessageSquare', 3, 5, 1),
  ('read_analysis', 'اقرأ تحليل', 'Read an analysis', 'اطّلع على تحليل واحد على الأقل', 'Read at least one analysis', 'TrendingUp', 1, 5, 2),
  ('like_content', 'أعجب بمحتوى', 'Like content', 'اضغط إعجاب على منشور أو إشارة', 'Like a post or signal', 'Heart', 2, 3, 3),
  ('create_post', 'انشر منشور', 'Create a post', 'شارك أفكارك مع المجتمع', 'Share your thoughts with the community', 'PenLine', 1, 10, 4),
  ('daily_login', 'سجّل دخولك اليوم', 'Daily login', 'افتح التطبيق وسجّل حضورك', 'Open the app and check in', 'LogIn', 1, 2, 5);

-- User daily quest progress
CREATE TABLE public.user_daily_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quest_id UUID NOT NULL REFERENCES public.daily_quests(id) ON DELETE CASCADE,
  quest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  points_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, quest_id, quest_date)
);

ALTER TABLE public.user_daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.user_daily_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.user_daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.user_daily_progress FOR UPDATE USING (auth.uid() = user_id);

-- User streaks tracking
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_completed_date DATE,
  total_quests_completed INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own streak" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own streak" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own streak" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- Function to complete a quest and handle streak
CREATE OR REPLACE FUNCTION public.increment_quest_progress(
  p_user_id UUID,
  p_quest_key TEXT,
  p_increment INT DEFAULT 1
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quest RECORD;
  v_progress RECORD;
  v_today DATE := CURRENT_DATE;
  v_new_count INT;
  v_completed BOOLEAN := false;
  v_all_done BOOLEAN;
  v_streak RECORD;
BEGIN
  -- Get quest definition
  SELECT * INTO v_quest FROM daily_quests WHERE quest_key = p_quest_key AND is_active = true;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Quest not found');
  END IF;

  -- Upsert progress
  INSERT INTO user_daily_progress (user_id, quest_id, quest_date, current_count)
  VALUES (p_user_id, v_quest.id, v_today, p_increment)
  ON CONFLICT (user_id, quest_id, quest_date)
  DO UPDATE SET current_count = LEAST(user_daily_progress.current_count + p_increment, v_quest.target_count)
  RETURNING * INTO v_progress;

  -- Check if just completed
  IF v_progress.current_count >= v_quest.target_count AND NOT v_progress.completed THEN
    UPDATE user_daily_progress SET completed = true, completed_at = now() WHERE id = v_progress.id;
    v_completed := true;

    -- Award points
    PERFORM add_user_points(p_user_id, 'daily_quest', v_quest.points_reward, NULL, v_quest.title_ar, v_quest.title_en);
  END IF;

  -- Check if ALL daily quests completed today
  SELECT NOT EXISTS (
    SELECT 1 FROM daily_quests dq
    WHERE dq.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_daily_progress udp
      WHERE udp.user_id = p_user_id AND udp.quest_id = dq.id AND udp.quest_date = v_today AND udp.completed = true
    )
  ) INTO v_all_done;

  -- Update streak if all quests done
  IF v_all_done THEN
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_completed_date, total_quests_completed)
    VALUES (p_user_id, 1, 1, v_today, 1)
    ON CONFLICT (user_id) DO UPDATE SET
      current_streak = CASE
        WHEN user_streaks.last_completed_date = v_today - 1 THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_completed_date = v_today THEN user_streaks.current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(
        user_streaks.longest_streak,
        CASE
          WHEN user_streaks.last_completed_date = v_today - 1 THEN user_streaks.current_streak + 1
          WHEN user_streaks.last_completed_date = v_today THEN user_streaks.current_streak
          ELSE 1
        END
      ),
      last_completed_date = v_today,
      total_quests_completed = user_streaks.total_quests_completed + (CASE WHEN user_streaks.last_completed_date = v_today THEN 0 ELSE 1 END),
      updated_at = now();
  END IF;

  RETURN json_build_object('success', true, 'completed', v_completed, 'all_done', v_all_done);
END;
$$;
