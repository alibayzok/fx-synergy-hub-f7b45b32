import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Trade {
  id: string;
  symbol: string;
  asset_type: 'forex' | 'metals' | 'crypto';
  direction: 'buy' | 'sell';
  entry_type: 'market' | 'limit' | 'stop';
  entry_price: number;
  sl_price: number;
  tp_prices: number[];
  timeframe: 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  status: 'pending' | 'running' | 'tp_hit' | 'sl_hit' | 'cancelled' | 'closed_manual';
  visibility: 'free' | 'vip';
  reason: string;
  risk_note?: string;
  alternative_scenario?: string;
  last_update_note?: string;
  followers_count: number | null;
  created_at: string;
  created_by: string;
}

export const useTrades = () => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        toast({
          title: 'Error',
          description: fetchError.message,
          variant: 'destructive'
        });
      } else {
        setTrades(data || []);
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
      fetchTrades();
    } else {
      setTrades([]);
      setLoading(false);
    }
  }, [user, fetchTrades]);

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('trades-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trades'
        },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrades]);

  const filterTrades = useCallback((
    statusFilter: 'all' | 'running' | 'pending' | 'closed',
    visibilityFilter: 'all' | 'free' | 'vip'
  ) => {
    let filtered = trades;

    // Filter by visibility
    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(t => t.visibility === visibilityFilter);
    }

    // Filter by status
    if (statusFilter === 'running') {
      filtered = filtered.filter(t => t.status === 'running');
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (statusFilter === 'closed') {
      filtered = filtered.filter(t => ['tp_hit', 'sl_hit', 'cancelled', 'closed_manual'].includes(t.status));
    }

    return filtered;
  }, [trades]);

  const getStats = useCallback(() => {
    const totalTrades = trades.length;
    const runningCount = trades.filter(t => t.status === 'running').length;
    const pendingCount = trades.filter(t => t.status === 'pending').length;
    const closedCount = trades.filter(t => ['tp_hit', 'sl_hit', 'cancelled', 'closed_manual'].includes(t.status)).length;
    const profitTrades = trades.filter(t => t.status === 'tp_hit').length;
    const lossTrades = trades.filter(t => t.status === 'sl_hit').length;
    const winRate = totalTrades > 0 && (profitTrades + lossTrades) > 0 
      ? Math.round((profitTrades / (profitTrades + lossTrades)) * 100) 
      : 0;

    return {
      totalTrades,
      runningCount,
      pendingCount,
      closedCount,
      profitTrades,
      lossTrades,
      winRate
    };
  }, [trades]);

  return {
    trades,
    loading,
    error,
    fetchTrades,
    filterTrades,
    getStats
  };
};
