import { useState, useEffect, useCallback } from 'react';

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

// Market data - in a real app, this would come from an API
// For now, we'll simulate real-time updates with random variations
const baseMarketData: Omit<MarketSymbol, 'change' | 'change_percent' | 'last_update'>[] = [
  { symbol: 'XAUUSD', name: 'Gold', asset_type: 'metals', price: 2847.35, high: 2852.00, low: 2831.20 },
  { symbol: 'EURUSD', name: 'Euro/Dollar', asset_type: 'forex', price: 1.0382, high: 1.0401, low: 1.0365 },
  { symbol: 'GBPUSD', name: 'Pound/Dollar', asset_type: 'forex', price: 1.2465, high: 1.2488, low: 1.2432 },
  { symbol: 'USDJPY', name: 'Dollar/Yen', asset_type: 'forex', price: 151.85, high: 152.45, low: 151.50 },
  { symbol: 'BTCUSD', name: 'Bitcoin', asset_type: 'crypto', price: 97250.00, high: 97800.00, low: 95100.00 },
  { symbol: 'ETHUSD', name: 'Ethereum', asset_type: 'crypto', price: 2685.40, high: 2710.00, low: 2615.00 },
  { symbol: 'XAGUSD', name: 'Silver', asset_type: 'metals', price: 31.45, high: 31.62, low: 31.05 },
  { symbol: 'USDCHF', name: 'Dollar/Franc', asset_type: 'forex', price: 0.8825, high: 0.8850, low: 0.8790 },
  { symbol: 'AUDUSD', name: 'Aussie/Dollar', asset_type: 'forex', price: 0.6320, high: 0.6345, low: 0.6285 },
  { symbol: 'NZDUSD', name: 'Kiwi/Dollar', asset_type: 'forex', price: 0.5680, high: 0.5710, low: 0.5645 },
];

// Store previous prices for calculating change
const previousPrices: Record<string, number> = {};
baseMarketData.forEach(item => {
  previousPrices[item.symbol] = item.price * (1 - (Math.random() * 0.01 - 0.005));
});

const generateMarketData = (): MarketSymbol[] => {
  return baseMarketData.map(item => {
    // Add small random variation to price
    const variation = (Math.random() * 0.002 - 0.001) * item.price;
    const newPrice = Number((item.price + variation).toFixed(item.symbol.includes('JPY') ? 2 : item.symbol.includes('USD') && !item.symbol.startsWith('XAU') && !item.symbol.startsWith('XAG') && !item.symbol.startsWith('BTC') && !item.symbol.startsWith('ETH') ? 5 : 2));
    
    const prevPrice = previousPrices[item.symbol] || item.price;
    const change = newPrice - prevPrice;
    const change_percent = (change / prevPrice) * 100;
    
    return {
      ...item,
      price: newPrice,
      change: Number(change.toFixed(4)),
      change_percent: Number(change_percent.toFixed(2)),
      high: Math.max(item.high, newPrice),
      low: Math.min(item.low, newPrice),
      last_update: new Date().toISOString()
    };
  });
};

export const useMarketData = (autoRefresh = true, refreshInterval = 5000) => {
  const [symbols, setSymbols] = useState<MarketSymbol[]>(() => generateMarketData());
  const [loading, setLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('watchlist');
    return saved ? JSON.parse(saved) : ['XAUUSD', 'EURUSD', 'BTCUSD'];
  });

  const refreshData = useCallback(() => {
    setSymbols(generateMarketData());
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

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

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
      );
    }

    // Filter by type
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
    refreshData,
    toggleWatchlist,
    filterSymbols
  };
};
