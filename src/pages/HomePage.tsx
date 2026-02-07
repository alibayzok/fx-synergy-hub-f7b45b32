import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketTicker } from '@/components/market/MarketTicker';
import { TradeCard } from '@/components/trades/TradeCard';
import { QuickActions } from '@/components/home/QuickActions';
import { PerformanceCard } from '@/components/home/PerformanceCard';
import { NewsCard } from '@/components/home/NewsCard';
import { mockMarketSymbols, mockTrades, mockNews, performanceStats, currentUser } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  // Filter trades based on user role (VIP can see all, free users see only free trades)
  const visibleTrades = currentUser.role === 'vip' 
    ? mockTrades 
    : mockTrades.filter(trade => trade.visibility === 'free');

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold gold-gradient">ASSASSIN FX</h1>
            <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
          >
            <span className="text-primary font-semibold">
              {currentUser.display_name.charAt(0)}
            </span>
          </motion.div>
        </div>
      </header>

      {/* Market Ticker */}
      <MarketTicker symbols={mockMarketSymbols} />

      <div className="px-4 py-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            {t('home.quickActions')}
          </h2>
          <QuickActions isAdmin={currentUser.role === 'admin'} />
        </section>

        {/* Performance */}
        <section>
          <PerformanceCard {...performanceStats} />
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
            {visibleTrades.slice(0, 2).map((trade) => (
              <TradeCard 
                key={trade.id} 
                trade={trade}
                onDiscussion={() => navigate(`/trades/${trade.id}`)}
              />
            ))}
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
