import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  sender_profile?: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  receiver_profile?: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface Friend {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  friend_since: string;
}

export interface PrivacySettings {
  messaging_privacy: 'everyone' | 'friends_only' | 'followers_only' | 'nobody';
  friends_visibility: 'everyone' | 'friends_only' | 'followers_only' | 'nobody';
  show_online_status: boolean;
}

export const useFriendship = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch pending friend requests (received)
  const fetchPendingRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('receiver_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch sender profiles
      if (data && data.length > 0) {
        const senderIds = data.map(r => r.sender_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', senderIds);

        const requestsWithProfiles = data.map(request => ({
          ...request,
          sender_profile: profiles?.find(p => p.user_id === request.sender_id)
        }));

        setPendingRequests(requestsWithProfiles);
      } else {
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  }, [user]);

  // Fetch sent friend requests
  const fetchSentRequests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('sender_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const receiverIds = data.map(r => r.receiver_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', receiverIds);

        const requestsWithProfiles = data.map(request => ({
          ...request,
          receiver_profile: profiles?.find(p => p.user_id === request.receiver_id)
        }));

        setSentRequests(requestsWithProfiles);
      } else {
        setSentRequests([]);
      }
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  }, [user]);

  // Fetch friends list
  const fetchFriends = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('friend_requests')
        .select('*')
        .eq('status', 'accepted')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get friend user IDs
        const friendIds = data.map(r => 
          r.sender_id === user.id ? r.receiver_id : r.sender_id
        );

        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', friendIds);

        const friendsList: Friend[] = data.map(request => {
          const friendId = request.sender_id === user.id ? request.receiver_id : request.sender_id;
          const profile = profiles?.find(p => p.user_id === friendId);
          return {
            user_id: friendId,
            display_name: profile?.display_name || null,
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
            friend_since: request.updated_at
          };
        });

        setFriends(friendsList);
      } else {
        setFriends([]);
      }
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  }, [user]);

  // Fetch privacy settings
  const fetchPrivacySettings = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_privacy_settings')
        .select('messaging_privacy, friends_visibility, show_online_status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPrivacySettings(data as PrivacySettings);
      } else {
        // Create default settings
        const defaultSettings: PrivacySettings = {
          messaging_privacy: 'everyone',
          friends_visibility: 'everyone',
          show_online_status: true
        };
        setPrivacySettings(defaultSettings);
      }
    } catch (err) {
      console.error('Error fetching privacy settings:', err);
    }
  }, [user]);

  // Accept friend request
  const acceptRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(t('social.friendRequestAccepted'));
      await Promise.all([fetchPendingRequests(), fetchFriends()]);
      return true;
    } catch (err) {
      console.error('Error accepting request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Reject friend request
  const rejectRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      if (error) throw error;

      toast.success(t('social.friendRequestRejected'));
      await fetchPendingRequests();
      return true;
    } catch (err) {
      console.error('Error rejecting request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Cancel sent request
  const cancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast.success(t('social.friendRequestCancelled'));
      await fetchSentRequests();
      return true;
    } catch (err) {
      console.error('Error cancelling request:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Remove friend
  const removeFriend = async (friendUserId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('friend_requests')
        .delete()
        .eq('status', 'accepted')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendUserId}),and(sender_id.eq.${friendUserId},receiver_id.eq.${user.id})`);

      if (error) throw error;

      toast.success(t('social.friendRemoved'));
      await fetchFriends();
      return true;
    } catch (err) {
      console.error('Error removing friend:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  // Update privacy settings
  const updatePrivacySettings = async (settings: Partial<PrivacySettings>) => {
    if (!user) return false;

    try {
      const { data: existing } = await supabase
        .from('user_privacy_settings')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_privacy_settings')
          .update(settings)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_privacy_settings')
          .insert({ user_id: user.id, ...settings });

        if (error) throw error;
      }

      setPrivacySettings(prev => prev ? { ...prev, ...settings } : null);
      toast.success(t('common.save'));
      return true;
    } catch (err) {
      console.error('Error updating privacy settings:', err);
      toast.error(t('common.error'));
      return false;
    }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([
        fetchPendingRequests(),
        fetchSentRequests(),
        fetchFriends(),
        fetchPrivacySettings()
      ]);
      setLoading(false);
    };

    if (user) {
      loadAll();
    } else {
      setLoading(false);
    }
  }, [user, fetchPendingRequests, fetchSentRequests, fetchFriends, fetchPrivacySettings]);

  return {
    pendingRequests,
    sentRequests,
    friends,
    privacySettings,
    loading,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeFriend,
    updatePrivacySettings,
    refetch: () => {
      fetchPendingRequests();
      fetchSentRequests();
      fetchFriends();
      fetchPrivacySettings();
    }
  };
};
