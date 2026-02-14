import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface BlockedUser {
  id: string;
  blocked_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useBlockUser = (targetUserId?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('id, blocked_id, created_at')
        .eq('blocker_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const blockedIds = data.map(b => b.blocked_id);
        const { data: profiles } = await supabase
          .from('profiles_public')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', blockedIds);

        const blockedWithProfiles = data.map(b => ({
          ...b,
          profile: profiles?.find(p => p.user_id === b.blocked_id)
        }));
        setBlockedUsers(blockedWithProfiles);
      } else {
        setBlockedUsers([]);
      }
    } catch (err) {
      console.error('Error fetching blocked users:', err);
    }
  }, [user]);

  // Check if specific user is blocked
  useEffect(() => {
    if (!user || !targetUserId) return;
    const checkBlocked = blockedUsers.some(b => b.blocked_id === targetUserId);
    setIsBlocked(checkBlocked);
  }, [user, targetUserId, blockedUsers]);

  useEffect(() => {
    if (user) fetchBlockedUsers();
  }, [user, fetchBlockedUsers]);

  const blockUser = async (userId: string, reason?: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: user.id, blocked_id: userId, reason });

      if (error) throw error;

      toast.success(t('social.userBlocked'));
      await fetchBlockedUsers();
      return true;
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.info(t('social.alreadyBlocked'));
      } else {
        console.error('Error blocking user:', err);
        toast.error(t('common.error'));
      }
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unblockUser = async (userId: string): Promise<boolean> => {
    if (!user) return false;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId);

      if (error) throw error;

      toast.success(t('social.userUnblocked'));
      await fetchBlockedUsers();
      return true;
    } catch (err) {
      console.error('Error unblocking user:', err);
      toast.error(t('common.error'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isUserBlocked = (userId: string): boolean => {
    return blockedUsers.some(b => b.blocked_id === userId);
  };

  return {
    blockedUsers,
    isBlocked,
    loading,
    blockUser,
    unblockUser,
    isUserBlocked,
    refetch: fetchBlockedUsers
  };
};
