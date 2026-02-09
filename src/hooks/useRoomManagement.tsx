import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface CommunityRoom {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  icon: string;
  color: string;
  is_private: boolean;
  requires_approval: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoomMember {
  id: string;
  room_id: string;
  user_id: string;
  role: 'member' | 'moderator' | 'owner';
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  joined_at: string;
  approved_by: string | null;
  approved_at: string | null;
  banned_until: string | null;
  ban_reason: string | null;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface RoomJoinRequest {
  id: string;
  room_id: string;
  user_id: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'banned';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export const useRoomManagement = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<CommunityRoom[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all rooms
  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('community_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check user's membership status in a room
  const getMembershipStatus = useCallback(async (roomId: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as RoomMember | null;
    } catch (error) {
      console.error('Error checking membership:', error);
      return null;
    }
  }, [user]);

  // Check if user has pending request
  const getPendingRequest = useCallback(async (roomId: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('room_join_requests')
        .select('*')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (error) throw error;
      return data as RoomJoinRequest | null;
    } catch (error) {
      console.error('Error checking pending request:', error);
      return null;
    }
  }, [user]);

  // Request to join a room
  const requestJoin = async (roomId: string, message?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('room_join_requests')
        .insert({
          room_id: roomId,
          user_id: user.id,
          message: message || null
        });

      if (error) {
        if (error.code === '23505') {
          toast({ title: 'لديك طلب انضمام معلق بالفعل', variant: 'destructive' });
        } else {
          throw error;
        }
        return false;
      }

      toast({ title: 'تم إرسال طلب الانضمام بنجاح' });
      return true;
    } catch (error) {
      console.error('Error requesting join:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Cancel join request
  const cancelJoinRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('room_join_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      toast({ title: 'تم إلغاء الطلب' });
      return true;
    } catch (error) {
      console.error('Error canceling request:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Leave a room
  const leaveRoom = async (roomId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast({ title: 'تم مغادرة الغرفة' });
      return true;
    } catch (error) {
      console.error('Error leaving room:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  return {
    rooms,
    loading,
    fetchRooms,
    getMembershipStatus,
    getPendingRequest,
    requestJoin,
    cancelJoinRequest,
    leaveRoom
  };
};

// Hook for room moderation (for moderators/admins)
export const useRoomModeration = (roomId: string) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<RoomJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<RoomMember['role'] | null>(null);

  // Check if current user is moderator/owner
  const checkModeratorStatus = useCallback(async () => {
    if (!user || !roomId) return;
    
    try {
      // First check the user's role in this room
      const { data: memberData } = await supabase
        .from('room_members')
        .select('role, status')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();

      if (memberData) {
        setCurrentUserRole(memberData.role as RoomMember['role']);
        setIsOwner(memberData.role === 'owner');
        setIsModerator(memberData.role === 'moderator' || memberData.role === 'owner' || isAdmin);
      } else {
        setCurrentUserRole(null);
        setIsOwner(false);
        setIsModerator(isAdmin);
      }
    } catch (error) {
      console.error('Error checking moderator status:', error);
      setIsModerator(isAdmin);
    }
  }, [user, roomId, isAdmin]);

  // Fetch room members
  const fetchMembers = useCallback(async () => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('*')
        .eq('room_id', roomId)
        .order('role', { ascending: false })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(m => m.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const membersWithProfiles = data.map(member => ({
          ...member,
          role: member.role as RoomMember['role'],
          status: member.status as RoomMember['status'],
          profile: profileMap.get(member.user_id) || null
        }));

        setMembers(membersWithProfiles);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Fetch pending join requests
  const fetchPendingRequests = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const { data, error } = await supabase
        .from('room_join_requests')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

        const requestsWithProfiles = data.map(request => ({
          ...request,
          status: request.status as RoomJoinRequest['status'],
          profile: profileMap.get(request.user_id) || null
        }));

        setPendingRequests(requestsWithProfiles);
      } else {
        setPendingRequests([]);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  }, [roomId]);

  // Approve join request
  const approveRequest = async (requestId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('room_join_requests')
        .update({
          status: 'approved',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({ title: 'تم قبول طلب الانضمام' });
      await fetchPendingRequests();
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Reject join request
  const rejectRequest = async (requestId: string, reason?: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('room_join_requests')
        .update({
          status: 'rejected',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          review_note: reason || null
        })
        .eq('id', requestId);

      if (error) throw error;
      
      toast({ title: 'تم رفض طلب الانضمام' });
      await fetchPendingRequests();
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Update member role - with permission checks
  const updateMemberRole = async (memberId: string, role: RoomMember['role']) => {
    // Find the target member
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) {
      toast({ title: 'العضو غير موجود', variant: 'destructive' });
      return false;
    }

    // Prevent changing owner's role
    if (targetMember.role === 'owner') {
      toast({ title: 'لا يمكن تغيير صلاحية المالك', variant: 'destructive' });
      return false;
    }

    // Only owner or admin can change roles
    if (!isOwner && !isAdmin) {
      toast({ title: 'صلاحية المالك أو الأدمن مطلوبة', variant: 'destructive' });
      return false;
    }

    // Moderators can't change other moderators (only owner/admin can)
    if (targetMember.role === 'moderator' && !isOwner && !isAdmin) {
      toast({ title: 'لا يمكنك تغيير صلاحية مشرف آخر', variant: 'destructive' });
      return false;
    }

    try {
      const { error } = await supabase
        .from('room_members')
        .update({ role })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({ title: 'تم تحديث الدور' });
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Ban member - with permission checks
  const banMember = async (memberId: string, reason: string, duration?: number) => {
    const targetMember = members.find(m => m.id === memberId);
    if (!targetMember) return false;

    // Can't ban owner
    if (targetMember.role === 'owner') {
      toast({ title: 'لا يمكن حظر المالك', variant: 'destructive' });
      return false;
    }

    // Moderators can't ban other moderators
    if (targetMember.role === 'moderator' && currentUserRole === 'moderator') {
      toast({ title: 'لا يمكنك حظر مشرف آخر', variant: 'destructive' });
      return false;
    }

    try {
      const bannedUntil = duration 
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from('room_members')
        .update({
          status: 'banned',
          ban_reason: reason,
          banned_until: bannedUntil
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({ title: 'تم حظر العضو' });
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error banning member:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Unban member
  const unbanMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .update({
          status: 'approved',
          ban_reason: null,
          banned_until: null
        })
        .eq('id', memberId);

      if (error) throw error;
      
      toast({ title: 'تم رفع الحظر' });
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error unbanning member:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  // Remove member
  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('room_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      
      toast({ title: 'تم إزالة العضو' });
      await fetchMembers();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      toast({ title: 'حدث خطأ', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    if (roomId) {
      checkModeratorStatus();
      fetchMembers();
      fetchPendingRequests();
    }
  }, [roomId, checkModeratorStatus, fetchMembers, fetchPendingRequests]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!roomId) return;

    const membersChannel = supabase
      .channel(`room-members-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_members', filter: `room_id=eq.${roomId}` },
        () => fetchMembers()
      )
      .subscribe();

    const requestsChannel = supabase
      .channel(`room-requests-${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'room_join_requests', filter: `room_id=eq.${roomId}` },
        () => fetchPendingRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(membersChannel);
      supabase.removeChannel(requestsChannel);
    };
  }, [roomId, fetchMembers, fetchPendingRequests]);

  return {
    members,
    pendingRequests,
    loading,
    isModerator,
    isOwner,
    currentUserRole,
    fetchMembers,
    fetchPendingRequests,
    approveRequest,
    rejectRequest,
    updateMemberRole,
    banMember,
    unbanMember,
    removeMember
  };
};
