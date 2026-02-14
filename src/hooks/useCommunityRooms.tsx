import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface RoomWithCounts {
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
      // Fetch rooms
      const { data: roomsData, error: roomsError } = await supabase
        .from('community_rooms')
        .select('*')
        .order('created_at', { ascending: true });

      if (roomsError) throw roomsError;

      // Fetch member counts per room
      const { data: membersData } = await supabase
        .from('room_members')
        .select('room_id')
        .eq('status', 'approved');

      const memberCountMap: Record<string, number> = {};
      membersData?.forEach(m => {
        memberCountMap[m.room_id] = (memberCountMap[m.room_id] || 0) + 1;
      });

      // Fetch user's last read timestamps if logged in
      let unreadMap: Record<string, number> = {};
      if (user) {
        // Get user's membership records for last read tracking
        const { data: membershipData } = await supabase
          .from('room_members')
          .select('room_id, joined_at')
          .eq('user_id', user.id)
          .eq('status', 'approved');

        const joinedRooms = new Map<string, string>();
        membershipData?.forEach(m => {
          joinedRooms.set(m.room_id, m.joined_at || new Date(0).toISOString());
        });

        // For each room the user is a member of, count messages after their join
        // We'll use a simple approach: count recent messages (last 24h) as "unread" indicator
        // A proper solution would track last_read_at per room
        if (joinedRooms.size > 0) {
          const roomIds = Array.from(joinedRooms.keys());
          
          // Get last visit timestamp from localStorage
          const lastVisits: Record<string, string> = JSON.parse(
            localStorage.getItem(`community_last_visits_${user.id}`) || '{}'
          );

          for (const roomId of roomIds) {
            const lastVisit = lastVisits[roomId] || joinedRooms.get(roomId) || new Date(0).toISOString();
            const { count } = await supabase
              .from('room_messages')
              .select('*', { count: 'exact', head: true })
              .eq('room_id', roomId)
              .gt('created_at', lastVisit)
              .neq('user_id', user.id);
            
            if (count && count > 0) {
              unreadMap[roomId] = count;
            }
          }
        }

        // For broadcast channels, count unread for all logged-in users
        const broadcastRooms = roomsData?.filter(r => r.is_broadcast && !joinedRooms.has(r.id)) || [];
        for (const room of broadcastRooms) {
          const lastVisit = JSON.parse(
            localStorage.getItem(`community_last_visits_${user.id}`) || '{}'
          )[room.id] || new Date(0).toISOString();
          
          const { count } = await supabase
            .from('room_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', room.id)
            .gt('created_at', lastVisit);
          
          if (count && count > 0) {
            unreadMap[room.id] = count;
          }
        }
      }

      const enrichedRooms: RoomWithCounts[] = (roomsData || []).map(room => ({
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
    
    // Update local state
    setRooms(prev => prev.map(r => 
      r.id === roomId ? { ...r, unread_count: 0 } : r
    ));
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  return { rooms, loading, refetch: fetchRooms, markRoomAsRead };
};
