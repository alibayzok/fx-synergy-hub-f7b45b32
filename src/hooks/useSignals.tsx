import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { playNotificationSound } from '@/lib/notification-sound';

interface Signal {
  id: string;
  title: string;
  content: string;
  symbol: string | null;
  asset_type: 'forex' | 'metals' | 'crypto' | null;
  timeframe: 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  visibility: 'free' | 'vip';
  attachments: string[];
  views_count: number;
  likes_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useSignals = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('signals')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        toast({ title: 'خطأ', description: fetchError.message, variant: 'destructive' });
      } else {
        setSignals((data as Signal[]) || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchSignals();
    } else {
      setSignals([]);
      setLoading(false);
    }
  }, [user, fetchSignals]);

  const initialLoadDone = useRef(false);

  useEffect(() => {
    const channel = supabase
      .channel('signals-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'signals' }, () => {
        if (initialLoadDone.current) {
          playNotificationSound('new_signal');
        }
        fetchSignals();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'signals' }, () => {
        fetchSignals();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'signals' }, () => {
        fetchSignals();
      })
      .subscribe();

    // Mark initial load as done after a short delay
    const timer = setTimeout(() => { initialLoadDone.current = true; }, 2000);

    return () => { supabase.removeChannel(channel); clearTimeout(timer); };
  }, [fetchSignals]);

  const createSignal = async (data: Omit<Signal, 'id' | 'views_count' | 'likes_count' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase.from('signals').insert(data);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'تم نشر الإشارة بنجاح' });
    return true;
  };

  const updateSignal = async (id: string, data: Partial<Signal>) => {
    const { error } = await supabase.from('signals').update(data).eq('id', id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'تم تحديث الإشارة' });
    return true;
  };

  const deleteSignal = async (id: string) => {
    const { error } = await supabase.from('signals').delete().eq('id', id);
    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return false;
    }
    toast({ title: 'تم حذف الإشارة' });
    return true;
  };

  const likeSignal = async (signalId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('signal_likes').insert({ signal_id: signalId, user_id: user.id });
    return !error;
  };

  const unlikeSignal = async (signalId: string) => {
    if (!user) return false;
    const { error } = await supabase.from('signal_likes').delete().eq('signal_id', signalId).eq('user_id', user.id);
    return !error;
  };

  return { signals, loading, error, fetchSignals, createSignal, updateSignal, deleteSignal, likeSignal, unlikeSignal };
};
