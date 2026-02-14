import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DailyQuest {
  id: string;
  quest_key: string;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  target_count: number;
  points_reward: number;
  sort_order: number;
}

interface QuestProgress {
  quest_id: string;
  current_count: number;
  completed: boolean;
}

interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  total_quests_completed: number;
}

export interface DailyQuestWithProgress extends DailyQuest {
  current_count: number;
  completed: boolean;
}

export const useDailyQuests = () => {
  const { user } = useAuth();
  const [quests, setQuests] = useState<DailyQuestWithProgress[]>([]);
  const [streak, setStreak] = useState<UserStreak>({ current_streak: 0, longest_streak: 0, last_completed_date: null, total_quests_completed: 0 });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setLoading(false); return; }

    try {
      // Fetch quests and progress in parallel
      const today = new Date().toISOString().split('T')[0];

      const [questsRes, progressRes, streakRes] = await Promise.all([
        supabase.from('daily_quests').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('user_daily_progress').select('quest_id, current_count, completed').eq('user_id', user.id).eq('quest_date', today),
        supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      const questDefs = (questsRes.data || []) as DailyQuest[];
      const progressMap = new Map<string, QuestProgress>();
      (progressRes.data || []).forEach((p: any) => progressMap.set(p.quest_id, p));

      const merged: DailyQuestWithProgress[] = questDefs.map(q => {
        const prog = progressMap.get(q.id);
        return { ...q, current_count: prog?.current_count || 0, completed: prog?.completed || false };
      });

      setQuests(merged);

      if (streakRes.data) {
        // Check if streak is still valid (last completed was yesterday or today)
        const lastDate = streakRes.data.last_completed_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastDate && lastDate !== today && lastDate !== yesterdayStr) {
          // Streak broken
          setStreak({ ...streakRes.data as UserStreak, current_streak: 0 });
        } else {
          setStreak(streakRes.data as UserStreak);
        }
      }

      // Auto-trigger daily_login quest
      const loginQuest = merged.find(q => q.quest_key === 'daily_login');
      if (loginQuest && !loginQuest.completed) {
        await supabase.rpc('increment_quest_progress', {
          p_user_id: user.id,
          p_quest_key: 'daily_login',
          p_increment: 1
        });
        // Refresh after login quest
        const [newProg, newStreak] = await Promise.all([
          supabase.from('user_daily_progress').select('quest_id, current_count, completed').eq('user_id', user.id).eq('quest_date', today),
          supabase.from('user_streaks').select('*').eq('user_id', user.id).maybeSingle(),
        ]);
        const newProgressMap = new Map<string, QuestProgress>();
        (newProg.data || []).forEach((p: any) => newProgressMap.set(p.quest_id, p));
        setQuests(questDefs.map(q => {
          const prog = newProgressMap.get(q.id);
          return { ...q, current_count: prog?.current_count || 0, completed: prog?.completed || false };
        }));
        if (newStreak.data) setStreak(newStreak.data as UserStreak);
      }
    } catch (err) {
      console.error('Error fetching daily quests:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const trackQuest = useCallback(async (questKey: string, increment = 1) => {
    if (!user) return;
    try {
      await supabase.rpc('increment_quest_progress', {
        p_user_id: user.id,
        p_quest_key: questKey,
        p_increment: increment
      });
      fetchData();
    } catch (err) {
      console.error('Error tracking quest:', err);
    }
  }, [user, fetchData]);

  const completedCount = quests.filter(q => q.completed).length;
  const totalCount = quests.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  return {
    quests,
    streak,
    loading,
    trackQuest,
    completedCount,
    totalCount,
    progressPercent,
    allCompleted,
    refetch: fetchData,
  };
};
