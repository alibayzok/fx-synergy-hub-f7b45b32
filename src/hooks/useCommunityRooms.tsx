import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface RoomWithCounts {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  icon: string;
  color: string;
  is_private: boolean;
  is_broadcast: boolean;
  requires_approval: boolean;
  category: 'channels' | 'discussions' | 'learning';
  members_count: number;
  unread_count: number;
}

export const useCommunityRooms = () => {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomWithCounts[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      // Fetch rooms + member counts in parallel
      const [roomsRes, membersRes] = await Promise.all([
        supabase.from('community_rooms').select('*').order('created_at', { ascending: true }),
        supabase.from('room_members').select('room_id').eq('status', 'approved'),
      ]);

      if (roomsRes.error) throw roomsRes.error;
      const roomsData = roomsRes.data || [];

      const memberCountMap: Record<string, number> = {};
      membersRes.data?.forEach(m => {
        memberCountMap[m.room_id] = (memberCountMap[m.room_id] || 0) + 1;
      });

      // Compute unread counts in parallel (not sequentially)
      let unreadMap: Record<string, number> = {};
      if (user) {
        const lastVisits: Record<string, string> = JSON.parse(
          localStorage.getItem(`community_last_visits_${user.id}`) || '{}'
        );

        // Get user memberships
        const { data: membershipData } = await supabase
          .from('room_members')
          .select('room_id, joined_at')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        const joinedRooms = new Map<string, string>();
        membershipData?.forEach(m => {
          joinedRooms.set(m.room_id, m.joined_at || new Date(0).toISOString());
        });

        // Build all unread queries in parallel
        const unreadQueries: { roomId: string; promise: Promise<{ count: number | null }> }[] = [];

        // Joined rooms
        for (const roomId of joinedRooms.keys()) {
          const lastVisit = lastVisits[roomId] || joinedRooms.get(roomId) || new Date(0).toISOString();
          unreadQueries.push({
            roomId,
            promise: supabase
              .from('room_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', roomId)
              .gt('created_at', lastVisit)
              .neq('user_id', user.id) as any,
          });
        }

        // Broadcast rooms not joined
        const broadcastRooms = roomsData.filter(r => r.is_broadcast && !joinedRooms.has(r.id));
        for (const room of broadcastRooms) {
          const lastVisit = lastVisits[room.id] || new Date(0).toISOString();
          unreadQueries.push({
            roomId: room.id,
            promise: supabase
              .from('room_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', room.id)
              .gt('created_at', lastVisit) as any,
          });
        }

        // Execute all in parallel
        const results = await Promise.all(unreadQueries.map(q => q.promise));
        results.forEach((res, i) => {
          const count = (res as any)?.count ?? 0;
          if (count > 0) {
            unreadMap[unreadQueries[i].roomId] = count;
          }
        });
      }

      const enrichedRooms: RoomWithCounts[] = roomsData.map(room => ({
        id: room.id,
        name: room.name,
        name_ar: room.name_ar,
        description: room.description,
        description_ar: room.description_ar,
        icon: room.icon || 'MessageSquare',
        color: room.color || 'blue',
        is_private: room.is_private || false,
        is_broadcast: room.is_broadcast || false,
        requires_approval: room.requires_approval || false,
        category: (room as any).category || 'discussions',
        members_count: memberCountMap[room.id] || 0,
        unread_count: unreadMap[room.id] || 0,
      }));

      setRooms(enrichedRooms);
    } catch (err) {
      console.error('Error fetching community rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRoomAsRead = (roomId: string) => {
    if (!user) return;
    const key = `community_last_visits_${user.id}`;
    const lastVisits = JSON.parse(localStorage.getItem(key) || '{}');
    lastVisits[roomId] = new Date().toISOString();
    localStorage.setItem(key, JSON.stringify(lastVisits));
    setRooms(prev => prev.map(r =>
      r.id === roomId ? { ...r, unread_count: 0 } : r
    ));
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  return { rooms, loading, refetch: fetchRooms, markRoomAsRead };
};
