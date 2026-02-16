import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  referral_code: string;
  points_awarded: number;
  status: string;
  created_at: string;
  referred_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export interface ReferralReward {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  points_cost: number;
  reward_type: string;
  reward_value: string | null;
  is_active: boolean;
  stock: number | null;
  sort_order: number;
}

export interface RewardRedemption {
  id: string;
  user_id: string;
  reward_id: string | null;
  redemption_type: string;
  points_spent: number;
  status: string;
  notes: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  reward?: ReferralReward;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

// Save referral code from URL to localStorage
export function captureReferralCode() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    localStorage.setItem('referral_code', ref);
    // Clean URL
    const url = new URL(window.location.href);
    url.searchParams.delete('ref');
    window.history.replaceState({}, '', url.toString());
  }
}

// Process referral after signup
export async function processReferralAfterSignup(userId: string) {
  const code = localStorage.getItem('referral_code');
  if (!code) return;

  try {
    const { error } = await supabase.rpc('process_referral', {
      p_referral_code: code,
      p_referred_user_id: userId,
    });
    if (!error) {
      localStorage.removeItem('referral_code');
    }
  } catch (err) {
    console.error('Referral processing failed:', err);
  }
}

export const useReferrals = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();

  // My referrals (people I referred)
  const myReferrals = useQuery({
    queryKey: ['my-referrals', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch referred profiles
      if (!data?.length) return [];
      const referredIds = data.map(r => r.referred_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, username')
        .in('user_id', referredIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      return data.map(r => ({
        ...r,
        referred_profile: profileMap.get(r.referred_id) || null,
      })) as Referral[];
    },
    enabled: !!user?.id,
  });

  // Total referral points earned
  const totalReferralPoints = (myReferrals.data || []).reduce((sum, r) => sum + r.points_awarded, 0);

  // Available rewards catalog
  const rewards = useQuery({
    queryKey: ['referral-rewards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('referral_rewards')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as ReferralReward[];
    },
  });

  // My redemptions
  const myRedemptions = useQuery({
    queryKey: ['my-redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('reward_redemptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch reward details
      const rewardIds = data?.filter(r => r.reward_id).map(r => r.reward_id) || [];
      let rewardMap = new Map();
      if (rewardIds.length) {
        const { data: rewardsData } = await supabase
          .from('referral_rewards')
          .select('*')
          .in('id', rewardIds);
        rewardMap = new Map(rewardsData?.map(r => [r.id, r]) || []);
      }

      return data?.map(r => ({
        ...r,
        reward: r.reward_id ? rewardMap.get(r.reward_id) : null,
      })) as RewardRedemption[];
    },
    enabled: !!user?.id,
  });

  // Redeem a reward from catalog
  const redeemReward = useMutation({
    mutationFn: async ({ rewardId, pointsCost }: { rewardId: string; pointsCost: number }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          reward_id: rewardId,
          redemption_type: 'catalog',
          points_spent: pointsCost,
        });
      if (error) throw error;

      // Deduct points
      await supabase.rpc('add_user_points', {
        p_user_id: user.id,
        p_points: -pointsCost,
        p_action_type: 'reward_redemption',
        p_description_ar: 'استبدال مكافأة',
        p_description_en: 'Reward redemption',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      toast.success(isRTL ? 'تم إرسال طلب الاستبدال بنجاح' : 'Redemption request submitted');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل إرسال الطلب' : 'Failed to submit request');
    },
  });

  // Manual withdrawal request
  const requestWithdrawal = useMutation({
    mutationFn: async ({ points, notes }: { points: number; notes: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('reward_redemptions')
        .insert({
          user_id: user.id,
          redemption_type: 'withdrawal',
          points_spent: points,
          notes,
        });
      if (error) throw error;

      await supabase.rpc('add_user_points', {
        p_user_id: user.id,
        p_points: -points,
        p_action_type: 'withdrawal_request',
        p_description_ar: 'طلب سحب نقاط',
        p_description_en: 'Points withdrawal request',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-redemptions'] });
      queryClient.invalidateQueries({ queryKey: ['user-points'] });
      toast.success(isRTL ? 'تم إرسال طلب السحب' : 'Withdrawal request submitted');
    },
    onError: () => {
      toast.error(isRTL ? 'فشل إرسال الطلب' : 'Failed to submit request');
    },
  });

  return {
    myReferrals: myReferrals.data || [],
    totalReferralPoints,
    rewards: rewards.data || [],
    myRedemptions: myRedemptions.data || [],
    redeemReward,
    requestWithdrawal,
    isLoading: myReferrals.isLoading,
  };
};
