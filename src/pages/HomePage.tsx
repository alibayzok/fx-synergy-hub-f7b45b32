import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogIn } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketTicker } from '@/components/market/MarketTicker';
import { TradeCard } from '@/components/trades/TradeCard';
import { QuickActions } from '@/components/home/QuickActions';
import { PerformanceCard } from '@/components/home/PerformanceCard';
import { NewsCard } from '@/components/home/NewsCard';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTrades } from '@/hooks/useTrades';
import { useMarketData } from '@/hooks/useMarketData';
import { useProfile } from '@/hooks/useProfile';
import { Skeleton } from '@/components/ui/skeleton';

// Static news for now - could be moved to database later
const mockNews = [
  {
    id: 'news-1',
    title_ar: 'الذهب يسجل أعلى مستوى في أسبوعين',
    title_en: 'Gold hits 2-week high',
    content_ar: 'ارتفع الذهب إلى أعلى مستوياته في أسبوعين مع تراجع الدولار...',
    content_en: 'Gold rose to its highest level in two weeks as the dollar weakened...',
    published_at: new Date().toISOString(),
    is_breaking: true,
  },
  {
    id: 'news-2',
    title_ar: 'قرار الفيدرالي المرتقب اليوم',
    title_en: 'Fed decision expected today',
    content_ar: 'الأسواق تترقب قرار الفيدرالي بشأن أسعار الفائدة...',
    content_en: 'Markets await Fed decision on interest rates...',
    published_at: new Date(Date.now() - 3600000).toISOString(),
    is_breaking: false,
  },
];

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  
  const { user, isAdmin, isVip, loading: authLoading } = useAuth();
  const { trades, loading: tradesLoading, getStats } = useTrades();
  const { symbols } = useMarketData();
  const { profile } = useProfile();

  const stats = getStats();

  // Show latest 2 trades
  const latestTrades = trades.slice(0, 2);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'aiAssistant':
        navigate('/ai-chat');
        break;
      case 'viewAnalyses':
        navigate('/analyses');
        break;
      case 'publishTrade':
        navigate('/admin');
        break;
      default:
        break;
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest';

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold gold-gradient">ASSASSIN FX</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
          {user ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 transition-colors"
            >
              <span className="text-primary font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </motion.button>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-2">
              <LogIn className="w-4 h-4" />
              {t('auth.login')}
            </Button>
          )}
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker symbols={symbols} />

      <div className="px-4 py-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t('home.quickActions')}
          </h2>
          <QuickActions isAdmin={isAdmin} onAction={handleQuickAction} />
        </section>

        {/* Performance */}
        <section>
          {tradesLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <PerformanceCard 
              winRate={stats.winRate}
              totalTrades={stats.totalTrades}
              profitTrades={stats.profitTrades}
              lossTrades={stats.lossTrades}
              totalPips={0}
            />
          )}
        </section>

        {/* Latest Trades */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('home.latestTrades')}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/trades')}
              className="text-primary h-8 gap-1"
            >
              {t('home.viewAll')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
          <div className="space-y-3">
            {tradesLoading ? (
              <>
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </>
            ) : latestTrades.length > 0 ? (
              latestTrades.map((trade) => (
                <TradeCard 
                  key={trade.id} 
                  trade={{
                    ...trade,
                    created_by: trade.created_by || 'admin',
                    followers_count: trade.followers_count || 0
                  }}
                  onClick={() => navigate('/trades')}
                />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {user ? t('admin.noTrades') : t('auth.loginPrompt')}
              </div>
            )}
          </div>
        </section>

        {/* Breaking News */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('home.breakingNews')}
            </h2>
          </div>
          <div className="space-y-2">
            {mockNews.map((news) => (
              <NewsCard key={news.id} news={news} />
            ))}
          </div>
        </section>

        {/* Disclaimer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-muted-foreground px-4 py-2 rounded-lg bg-muted/30"
        >
          {t('disclaimer.text')}
        </motion.p>
      </div>
    </AppLayout>
  );
};

export default HomePage;
