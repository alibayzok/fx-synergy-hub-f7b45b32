import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface UserPoints {
  id: string;
  user_id: string;
  total_points: number;
  level: number;
  level_name_ar: string;
  level_name_en: string;
}

export interface Badge {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  color: string;
  points_required: number;
  badge_type: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface PointTransaction {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  description_ar: string;
  description_en: string;
  created_at: string;
}

export interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  level: number;
  level_name_ar: string;
  level_name_en: string;
  display_name?: string;
  avatar_url?: string;
}

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2500, 5000, 7500, 10000];

export function getNextLevelPoints(currentPoints: number, currentLevel: number): number {
  if (currentLevel >= 10) return currentPoints;
  return LEVEL_THRESHOLDS[currentLevel] || 10000;
}

export function getLevelProgress(currentPoints: number, currentLevel: number): number {
  if (currentLevel >= 10) return 100;
  const prevThreshold = currentLevel > 1 ? LEVEL_THRESHOLDS[currentLevel - 1] : 0;
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel] || 10000;
  const progress = ((currentPoints - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
  return Math.min(Math.max(progress, 0), 100);
}

export const useGamification = () => {
  const { user } = useAuth();

  const myPoints = useQuery({
    queryKey: ['user-points', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserPoints | null;
    },
    enabled: !!user?.id,
  });

  const badges = useQuery({
    queryKey: ['badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as Badge[];
    },
  });

  const myBadges = useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('user_badges')
        .select('*, badges(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user?.id,
  });

  const pointHistory = useQuery({
    queryKey: ['point-transactions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('point_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as PointTransaction[];
    },
    enabled: !!user?.id,
  });

  const leaderboard = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { data: pointsData, error: pointsError } = await supabase
        .from('user_points')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(20);
      if (pointsError) throw pointsError;

      if (!pointsData?.length) return [];

      const userIds = pointsData.map((p: any) => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) || []);

      return pointsData.map((p: any) => {
        const profile = profileMap.get(p.user_id) as any;
        return {
          ...p,
          display_name: profile?.display_name || 'مستخدم',
          avatar_url: profile?.avatar_url,
        };
      }) as LeaderboardEntry[];
    },
  });

  return {
    myPoints: myPoints.data,
    badges: badges.data || [],
    myBadges: myBadges.data || [],
    pointHistory: pointHistory.data || [],
    leaderboard: leaderboard.data || [],
    isLoading: myPoints.isLoading || badges.isLoading,
  };
};
