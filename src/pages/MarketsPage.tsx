import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Search, Star } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketCard } from '@/components/market/MarketCard';
import { mockMarketSymbols, currentUser } from '@/data/mockData';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AssetType } from '@/types';

type FilterTab = 'all' | 'watchlist' | 'forex' | 'metals' | 'crypto';

const MarketsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>(currentUser.watchlist);

  const filterSymbols = () => {
    let filtered = mockMarketSymbols;

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        s => s.symbol.toLowerCase().includes(query) || s.name.toLowerCase().includes(query)
      );
    }

    // Filter by tab
    if (activeTab === 'watchlist') {
      filtered = filtered.filter(s => watchlist.includes(s.symbol));
    } else if (activeTab !== 'all') {
      filtered = filtered.filter(s => s.asset_type === activeTab);
    }

    return filtered;
  };

  const filteredSymbols = filterSymbols();

  const toggleWatchlist = (symbol: string) => {
    setWatchlist(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  const tabs: { key: FilterTab; icon?: typeof Star }[] = [
    { key: 'all' },
    { key: 'watchlist', icon: Star },
    { key: 'forex' },
    { key: 'metals' },
    { key: 'crypto' },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-foreground mb-3">{t('markets.title')}</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('markets.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 bg-muted/50 border-border/50"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                  activeTab === tab.key
                    ? tab.key === 'watchlist' 
                      ? "bg-primary text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {Icon && <Icon className={cn("w-3 h-3", activeTab === tab.key && "fill-current")} />}
                {tab.key === 'watchlist' ? t('markets.watchlist') : t(`markets.${tab.key}`)}
              </button>
            );
          })}
        </div>
      </header>

      {/* Markets List */}
      <div className="px-4 py-4 space-y-2">
        {filteredSymbols.length > 0 ? (
          filteredSymbols.map((symbol, index) => (
            <motion.div
              key={symbol.symbol}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <MarketCard
                symbol={symbol}
                isWatchlisted={watchlist.includes(symbol.symbol)}
                onToggleWatchlist={() => toggleWatchlist(symbol.symbol)}
              />
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Star className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {activeTab === 'watchlist' 
                ? 'No symbols in your watchlist' 
                : 'No symbols found'}
            </p>
          </div>
        )}

        {/* Last Update */}
        <p className="text-center text-xs text-muted-foreground pt-4">
          {t('markets.lastUpdate')}: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </AppLayout>
  );
};

export default MarketsPage;
