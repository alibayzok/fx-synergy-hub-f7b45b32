import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserRelationship {
  isFollowing: boolean;
  isFollowedBy: boolean;
  friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'rejected';
  friendRequestId?: string;
}

export const useSocial = (targetUserId?: string) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [relationship, setRelationship] = useState<UserRelationship>({
    isFollowing: false,
    isFollowedBy: false,
    friendStatus: 'none'
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0, friends: 0 });

  // Fetch relationship status
  const fetchRelationship = useCallback(async () => {
    if (!user || !targetUserId || user.id === targetUserId) {
      setLoading(false);
      return;
    }

    try {
      // Check if following
      const { data: followingData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();

      // Check if followed by
      const { data: followedByData } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', targetUserId)
        .eq('following_id', user.id)
        .maybeSingle();

      // Check friend request status
      const { data: friendData } = await supabase
        .from('friend_requests')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .maybeSingle();

      let friendStatus: UserRelationship['friendStatus'] = 'none';
      let friendRequestId: string | undefined;

      if (friendData) {
        friendRequestId = friendData.id;
        if (friendData.status === 'accepted') {
          friendStatus = 'accepted';
        } else if (friendData.status === 'rejected') {
          friendStatus = 'rejected';
        } else if (friendData.sender_id === user.id) {
          friendStatus = 'pending_sent';
        } else {
          friendStatus = 'pending_received';
        }
      }

      setRelationship({
        isFollowing: !!followingData,
        isFollowedBy: !!followedByData,
        friendStatus,
        friendRequestId
      });
    } catch (err) {
      console.error('Error fetching relationship:', err);
    } finally {
      setLoading(false);
    }
  }, [user, targetUserId]);

  // Fetch user stats (followers, following, friends)
  const fetchStats = useCallback(async () => {
    const userId = targetUserId || user?.id;
    if (!userId) return;

    try {
      const [
        { count: followersCount },
        { count: followingCount },
        { count: friendsCount }
      ] = await Promise.all([
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
        supabase.from('friend_requests').select('*', { count: 'exact', head: true })
          .eq('status', 'accepted')
          .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      ]);

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        friends: friendsCount || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [user, targetUserId]);

  useEffect(() => {
    fetchRelationship();
    fetchStats();
  }, [fetchRelationship, fetchStats]);

  // Follow user
  const followUser = async () => {
    if (!user || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: user.id, following_id: targetUserId });

      if (error) throw error;

      setRelationship(prev => ({ ...prev, isFollowing: true }));
      setStats(prev => ({ ...prev, followers: prev.followers + 1 }));
      toast.success(t('social.followed'));
      return true;
    } catch (err) {
      console.error('Error following:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Unfollow user
  const unfollowUser = async () => {
    if (!user || !targetUserId) return false;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      setRelationship(prev => ({ ...prev, isFollowing: false }));
      setStats(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
      toast.success(t('social.unfollowed'));
      return true;
    } catch (err) {
      console.error('Error unfollowing:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Send friend request
  const sendFriendRequest = async () => {
    if (!user || !targetUserId) return false;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .insert({ sender_id: user.id, receiver_id: targetUserId })
        .select()
        .single();

      if (error) throw error;

      setRelationship(prev => ({ 
        ...prev, 
        friendStatus: 'pending_sent',
        friendRequestId: data.id 
      }));
      toast.success(t('social.friendRequestSent'));
      return true;
    } catch (err) {
      console.error('Error sending friend request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Accept friend request
  const acceptFriendRequest = async () => {
    if (!relationship.friendRequestId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', relationship.friendRequestId);

      if (error) throw error;

      setRelationship(prev => ({ ...prev, friendStatus: 'accepted' }));
      setStats(prev => ({ ...prev, friends: prev.friends + 1 }));
      toast.success(t('social.friendRequestAccepted'));
      return true;
    } catch (err) {
      console.error('Error accepting friend request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Reject friend request
  const rejectFriendRequest = async () => {
    if (!relationship.friendRequestId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', relationship.friendRequestId);

      if (error) throw error;

      setRelationship(prev => ({ ...prev, friendStatus: 'rejected' }));
      toast.success(t('social.friendRequestRejected'));
      return true;
    } catch (err) {
      console.error('Error rejecting friend request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Cancel friend request (for sender)
  const cancelFriendRequest = async () => {
    if (!relationship.friendRequestId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', relationship.friendRequestId);

      if (error) throw error;

      setRelationship(prev => ({ 
        ...prev, 
        friendStatus: 'none',
        friendRequestId: undefined 
      }));
      toast.success(t('social.friendRequestCancelled'));
      return true;
    } catch (err) {
      console.error('Error cancelling friend request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Remove friend
  const removeFriend = async () => {
    if (!relationship.friendRequestId) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', relationship.friendRequestId);

      if (error) throw error;

      setRelationship(prev => ({ 
        ...prev, 
        friendStatus: 'none',
        friendRequestId: undefined 
      }));
      setStats(prev => ({ ...prev, friends: Math.max(0, prev.friends - 1) }));
      toast.success(t('social.friendRemoved'));
      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  return {
    relationship,
    stats,
    loading,
    followUser,
    unfollowUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    refetch: () => {
      fetchRelationship();
      fetchStats();
    }
  };
};
