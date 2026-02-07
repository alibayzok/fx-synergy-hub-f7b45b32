import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Crown } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradeCard } from '@/components/trades/TradeCard';
import { mockTrades, currentUser } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TradeStatus, TradeVisibility } from '@/types';

type FilterTab = 'all' | 'running' | 'pending' | 'closed';
type VisibilityFilter = 'all' | 'free' | 'vip';

const TradesPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');

  const isVip = currentUser.role === 'vip' || currentUser.role === 'admin';

  const filterTrades = () => {
    let filtered = mockTrades;

    // Filter by visibility (VIP access)
    if (!isVip) {
      filtered = filtered.filter(t => t.visibility === 'free');
    } else if (visibilityFilter !== 'all') {
      filtered = filtered.filter(t => t.visibility === visibilityFilter);
    }

    // Filter by status
    if (activeTab === 'running') {
      filtered = filtered.filter(t => t.status === 'running');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(t => t.status === 'pending');
    } else if (activeTab === 'closed') {
      filtered = filtered.filter(t => ['tp_hit', 'sl_hit', 'cancelled', 'closed_manual'].includes(t.status));
    }

    return filtered;
  };

  const filteredTrades = filterTrades();

  const tabs: { key: FilterTab; count: number }[] = [
    { key: 'all', count: mockTrades.length },
    { key: 'running', count: mockTrades.filter(t => t.status === 'running').length },
    { key: 'pending', count: mockTrades.filter(t => t.status === 'pending').length },
    { key: 'closed', count: mockTrades.filter(t => ['tp_hit', 'sl_hit', 'cancelled', 'closed_manual'].includes(t.status)).length },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('trades.title')}</h1>
          <Button variant="ghost" size="sm" className="h-9 gap-2">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {t(`trades.${tab.key}`)}
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                activeTab === tab.key ? "bg-primary-foreground/20" : "bg-background/50"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* VIP Filter (only for VIP users) */}
        {isVip && (
          <div className="flex gap-2 px-4 pb-3">
            {(['all', 'free', 'vip'] as VisibilityFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setVisibilityFilter(filter)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors",
                  visibilityFilter === filter
                    ? filter === 'vip' 
                      ? "bg-vip/20 text-vip border border-vip/30"
                      : "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter === 'vip' && <Crown className="w-3 h-3" />}
                {t(`trades.${filter}`)}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Trades List */}
      <div className="px-4 py-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTrades.length > 0 ? (
            filteredTrades.map((trade, index) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <TradeCard trade={trade} />
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <p className="text-muted-foreground">{t('common.loading')}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
};

export default TradesPage;
