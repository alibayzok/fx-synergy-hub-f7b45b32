import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MarketSymbol {
  symbol: string;
  name: string;
  asset_type: 'forex' | 'metals' | 'crypto';
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  last_update: string;
}

// Fallback data used only until first API response
const fallbackData: MarketSymbol[] = [
  { symbol: 'XAUUSD', name: 'Gold', asset_type: 'metals', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'EURUSD', name: 'Euro/Dollar', asset_type: 'forex', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'GBPUSD', name: 'Pound/Dollar', asset_type: 'forex', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'USDJPY', name: 'Dollar/Yen', asset_type: 'forex', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'BTCUSD', name: 'Bitcoin', asset_type: 'crypto', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'ETHUSD', name: 'Ethereum', asset_type: 'crypto', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'XAGUSD', name: 'Silver', asset_type: 'metals', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'USDCHF', name: 'Dollar/Franc', asset_type: 'forex', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'AUDUSD', name: 'Aussie/Dollar', asset_type: 'forex', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
  { symbol: 'NZDUSD', name: 'Kiwi/Dollar', asset_type: 'forex', price: 0, change: 0, change_percent: 0, high: 0, low: 0, last_update: '' },
];

export const useMarketData = (autoRefresh = true, refreshInterval = 90000) => {
  const [symbols, setSymbols] = useState<MarketSymbol[]>(fallbackData);
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : ['XAUUSD', 'EURUSD', 'BTCUSD'];
  });

  const fetchMarketData = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('market-data');
      if (error) throw error;
      if (Array.isArray(data) && data.length > 0) {
        setSymbols(data as MarketSymbol[]);
      }
    } catch (err) {
      console.error('Failed to fetch market data:', err);
    } finally {
      setLoading(false);
      hasFetched.current = true;
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchMarketData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchMarketData]);

  const toggleWatchlist = useCallback((symbol: string) => {
    setWatchlist(prev => {
      const updated = prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem('watchlist', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const filterSymbols = useCallback((
    filter: 'all' | 'watchlist' | 'forex' | 'metals' | 'crypto',
    searchQuery: string = ''
  ) => {
    let filtered = symbols;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
      );
    }

    if (filter === 'watchlist') {
      filtered = filtered.filter(s => watchlist.includes(s.symbol));
    } else if (filter !== 'all') {
      filtered = filtered.filter(s => s.asset_type === filter);
    }

    return filtered;
  }, [symbols, watchlist]);

  return {
    symbols,
    loading,
    watchlist,
    refreshData: fetchMarketData,
    toggleWatchlist,
    filterSymbols
  };
};
