import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Crown, LogIn } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { TradeCard } from '@/components/trades/TradeCard';
import { TradeStats } from '@/components/trades/TradeStats';
import { TradeDetailSheet } from '@/components/trades/TradeDetailSheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useTrades } from '@/hooks/useTrades';
import { useNavigate } from 'react-router-dom';
import { Trade } from '@/types';

type FilterTab = 'all' | 'running' | 'pending' | 'closed';
type VisibilityFilter = 'all' | 'free' | 'vip';

const TradesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { user, isVip, isAdmin, loading: authLoading } = useAuth();
  const { trades, loading: tradesLoading, filterTrades, getStats } = useTrades();

  const stats = getStats();
  const isVipUser = isVip || isAdmin;
  const filteredTrades = filterTrades(activeTab, visibilityFilter);

  const tabs: { key: FilterTab; count: number }[] = [
    { key: 'all', count: stats.totalTrades },
    { key: 'running', count: stats.runningCount },
    { key: 'pending', count: stats.pendingCount },
    { key: 'closed', count: stats.closedCount },
  ];

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
    setSheetOpen(true);
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <AppLayout>
        <header className="sticky top-0 z-30 glass-card border-b border-border/30">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-foreground">{t('trades.title')}</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{t('auth.login')}</h2>
            <p className="text-muted-foreground">{t('auth.loginPrompt')}</p>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('auth.login')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('trades.title')}</h1>
          <Button variant="ghost" size="sm" className="h-9 gap-2 me-20">
            <Filter className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Section */}
        <TradeStats stats={stats} />

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
                "text-xs px-1.5 py-0.5 rounded-full trading-number",
                activeTab === tab.key ? "bg-primary-foreground/20" : "bg-background/50"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* VIP Filter (only for VIP users) */}
        {isVipUser && (
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
        {tradesLoading ? (
          <>
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTrades.length > 0 ? (
              filteredTrades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <TradeCard 
                    trade={{
                      ...trade,
                      created_by: trade.created_by || 'admin',
                      followers_count: trade.followers_count || 0
                    }}
                    onClick={() => handleTradeClick({
                      ...trade,
                      created_by: trade.created_by || 'admin',
                      followers_count: trade.followers_count || 0
                    })}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <p className="text-muted-foreground">{t('admin.noTrades')}</p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Trade Detail Sheet */}
      <TradeDetailSheet
        trade={selectedTrade}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </AppLayout>
  );
};

export default TradesPage;
