import { useEffect } from 'react';
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
import { useAppSettings } from '@/hooks/useAppSettings';
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
  const { profile, loading: profileLoading } = useProfile();
  const { getSetting } = useAppSettings();
  const appName = getSetting('app_name', 'ASSASSIN FX');

  // Redirect to onboarding if not completed
  useEffect(() => {
    if (user && !profileLoading && profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, profileLoading, navigate]);

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
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div 
          className="absolute top-0 end-0 w-96 h-96 rounded-full blur-3xl opacity-30"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute bottom-1/3 start-0 w-80 h-80 rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, hsl(var(--vip) / 0.1) 0%, transparent 70%)' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 glass-premium border-b border-border/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold gold-gradient">{appName}</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
          {user ? (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center hover:border-primary/60 transition-all shadow-lg"
            >
              <span className="text-primary font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </motion.button>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-2 shadow-lg">
              <LogIn className="w-4 h-4" />
              {t('auth.login')}
            </Button>
          )}
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker symbols={symbols} />

      <div className="px-4 py-4 space-y-6 page-transition">
        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t('home.quickActions')}
          </h2>
          <QuickActions isAdmin={isAdmin} onAction={handleQuickAction} />
        </motion.section>

        {/* Performance */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {tradesLoading ? (
            <Skeleton className="h-32 w-full rounded-xl" />
          ) : (
            <div className="card-hover rounded-xl">
              <PerformanceCard 
                winRate={stats.winRate}
                totalTrades={stats.totalTrades}
                profitTrades={stats.profitTrades}
                lossTrades={stats.lossTrades}
                totalPips={0}
              />
            </div>
          )}
        </motion.section>

        {/* Latest Trades */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('home.latestTrades')}
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/trades')}
              className="text-primary h-8 gap-1 hover:bg-primary/10"
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
              latestTrades.map((trade, index) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="card-hover rounded-xl"
                >
                  <TradeCard 
                    trade={{
                      ...trade,
                      created_by: trade.created_by || 'admin',
                      followers_count: trade.followers_count || 0
                    }}
                    onClick={() => navigate('/trades')}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground glass-card rounded-xl">
                {user ? t('admin.noTrades') : t('auth.loginPrompt')}
              </div>
            )}
          </div>
        </motion.section>

        {/* Breaking News */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('home.breakingNews')}
            </h2>
          </div>
          <div className="space-y-2">
            {mockNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="card-hover rounded-lg"
              >
                <NewsCard news={news} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Disclaimer */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center text-xs text-muted-foreground px-4 py-3 rounded-xl glass-card"
        >
          {t('disclaimer.text')}
        </motion.p>
      </div>
    </AppLayout>
  );
};

export default HomePage;
