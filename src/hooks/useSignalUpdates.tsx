import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SignalUpdate {
  id: string;
  parent_id: string;
  parent_type: string;
  content: string;
  attachments: string[] | null;
  created_by: string | null;
  created_at: string;
  telegram_message_id: number | null;
}

export const useSignalUpdates = (parentId: string | null, parentType: 'signal' | 'analysis') => {
  const [updates, setUpdates] = useState<SignalUpdate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUpdates = useCallback(async () => {
    if (!parentId) return;
    setLoading(true);
    const { data } = await supabase
      .from('signal_updates')
      .select('*')
      .eq('parent_id', parentId)
      .eq('parent_type', parentType)
      .order('created_at', { ascending: true });
    setUpdates((data as SignalUpdate[]) || []);
    setLoading(false);
  }, [parentId, parentType]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Realtime
  useEffect(() => {
    if (!parentId) return;
    const channel = supabase
      .channel(`updates-${parentId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signal_updates', filter: `parent_id=eq.${parentId}` }, () => {
        fetchUpdates();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [parentId, fetchUpdates]);

  const addUpdate = async (content: string, attachments?: string[]) => {
    if (!parentId) return false;
    const { error } = await supabase.from('signal_updates').insert({
      parent_id: parentId,
      parent_type: parentType,
      content,
      attachments: attachments || null,
    });
    return !error;
  };

  return { updates, loading, addUpdate, refetch: fetchUpdates };
};

// Batch hook for loading updates for multiple items at once
export const useBatchUpdates = (parentIds: string[], parentType: 'signal' | 'analysis') => {
  const [updatesMap, setUpdatesMap] = useState<Record<string, SignalUpdate[]>>({});
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    if (parentIds.length === 0) return;
    setLoading(true);
    const { data } = await supabase
      .from('signal_updates')
      .select('*')
      .in('parent_id', parentIds)
      .eq('parent_type', parentType)
      .order('created_at', { ascending: true });

    const map: Record<string, SignalUpdate[]> = {};
    (data as SignalUpdate[] || []).forEach(u => {
      if (!map[u.parent_id]) map[u.parent_id] = [];
      map[u.parent_id].push(u);
    });
    setUpdatesMap(map);
    setLoading(false);
  }, [parentIds.join(','), parentType]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Realtime for any signal_updates changes
  useEffect(() => {
    if (parentIds.length === 0) return;
    const channel = supabase
      .channel(`batch-updates-${parentType}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'signal_updates' }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll, parentIds.length, parentType]);

  return { updatesMap, loading };
};
