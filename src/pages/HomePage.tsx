import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogIn, Radio, Clock, Eye, Heart } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarketTicker } from '@/components/market/MarketTicker';
import { QuickActions } from '@/components/home/QuickActions';
import { NewsCard } from '@/components/home/NewsCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSignals } from '@/hooks/useSignals';
import { useMarketData } from '@/hooks/useMarketData';
import { useProfile } from '@/hooks/useProfile';
import { useAppSettings } from '@/hooks/useAppSettings';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

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
  const locale = isRTL ? ar : enUS;
  
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { signals, loading: analysesLoading } = useSignals();
  const { symbols } = useMarketData();
  const { profile, loading: profileLoading } = useProfile();
  const { getSetting } = useAppSettings();
  const appName = getSetting('app_name', 'ASSASSIN FX');

  useEffect(() => {
    if (user && !profileLoading && profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, profileLoading, navigate]);

  const latestSignals = signals.slice(0, 3);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'aiAssistant': navigate('/ai-chat'); break;
      case 'viewAnalyses': navigate('/analyses'); break;
      case 'viewSignals': navigate('/trades'); break;
      default: break;
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest';

  return (
    <AppLayout>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 end-0 w-96 h-96 rounded-full blur-3xl opacity-30" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)' }} />
      </div>

      <header className="sticky top-0 z-40 glass-premium border-b border-border/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {getSetting('logo_url') ? (
              <img src={getSetting('logo_url')} alt={appName} className="h-8 w-8 rounded-lg object-contain" />
            ) : null}
            <div>
              <h1 className="text-xl font-bold gold-gradient">{appName}</h1>
              <p className="text-xs text-muted-foreground">{t('app.tagline')}</p>
            </div>
          </div>
          {user ? (
            <motion.button
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/40 flex items-center justify-center hover:border-primary/60 transition-all shadow-lg"
            >
              <span className="text-primary font-semibold">{displayName.charAt(0).toUpperCase()}</span>
            </motion.button>
          ) : (
            <Button size="sm" onClick={() => navigate('/auth')} className="gap-2 shadow-lg">
              <LogIn className="w-4 h-4" />
              {t('auth.login')}
            </Button>
          )}
        </div>
      </header>

      <MarketTicker symbols={symbols} />

      <div className="px-4 py-4 space-y-6 page-transition">
        {/* Quick Actions */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('home.quickActions')}</h2>
          <QuickActions isAdmin={isAdmin} onAction={handleQuickAction} />
        </motion.section>

        {/* Latest Signals - Telegram broadcast style */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              آخر الإشارات
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/trades')} className="text-primary h-8 gap-1 hover:bg-primary/10">
              {t('home.viewAll')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
          <div className="space-y-3">
            {analysesLoading ? (
              <>
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-32 w-full rounded-xl" />
              </>
            ) : latestSignals.length > 0 ? (
              latestSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  onClick={() => navigate('/trades')}
                  className="cursor-pointer"
                >
                  <div className="rounded-xl bg-card/60 border border-border/40 p-3 space-y-2 hover:border-primary/30 transition-colors">
                    <div className="flex items-center gap-2">
                      {signal.symbol && (
                        <Badge variant="outline" className="font-mono text-xs bg-primary/10 border-primary/30 text-primary">
                          {signal.symbol}
                        </Badge>
                      )}
                      {signal.timeframe && <Badge variant="secondary" className="text-[10px]">{signal.timeframe}</Badge>}
                    </div>
                    <h3 className="font-semibold text-sm">{signal.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{signal.content}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{signal.likes_count || 0}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{signal.views_count || 0}</span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground glass-card rounded-xl">
                {user ? 'لا توجد إشارات حالياً' : t('auth.loginPrompt')}
              </div>
            )}
          </div>
        </motion.section>

        {/* Breaking News */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground">{t('home.breakingNews')}</h2>
          </div>
          <div className="space-y-2">
            {mockNews.map((news, index) => (
              <motion.div key={news.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + index * 0.1 }} className="card-hover rounded-lg">
                <NewsCard news={news} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="text-center text-xs text-muted-foreground px-4 py-3 rounded-xl glass-card">
          {t('disclaimer.text')}
        </motion.p>
      </div>
    </AppLayout>
  );
};

export default HomePage;
