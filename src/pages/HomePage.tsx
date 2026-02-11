import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogIn, Radio, Clock, Eye, Heart, Megaphone, BookOpen, TrendingUp, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { QuickActions } from '@/components/home/QuickActions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSignals } from '@/hooks/useSignals';
import { useProfile } from '@/hooks/useProfile';
import { useAppSettings } from '@/hooks/useAppSettings';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  summary_ar: string | null;
  summary_en: string | null;
  image_url: string | null;
  category: string;
  created_at: string;
}

const HomePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const locale = isRTL ? ar : enUS;
  
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { signals, loading: signalsLoading } = useSignals();
  const { profile, loading: profileLoading } = useProfile();
  const { getSetting, getBoolean } = useAppSettings();
  const appName = getSetting('app_name', 'ASSASSIN FX');

  // Admin announcement
  const announcementActive = getBoolean('home_announcement_active');
  const announcementText = getSetting('home_announcement_text');
  const announcementColor = getSetting('home_announcement_color', '#f59e0b');

  // Real articles
  const [articles, setArticles] = useState<Article[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  useEffect(() => {
    if (user && !profileLoading && profile && !profile.onboarding_completed) {
      navigate('/onboarding', { replace: true });
    }
  }, [user, profile, profileLoading, navigate]);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const { data } = await supabase
          .from('articles')
          .select('id, title_ar, title_en, summary_ar, summary_en, image_url, category, created_at')
          .eq('is_published', true)
          .order('created_at', { ascending: false })
          .limit(4);
        setArticles(data || []);
      } catch (e) {
        console.error('Error fetching articles:', e);
      } finally {
        setArticlesLoading(false);
      }
    };
    fetchArticles();
  }, []);

  const latestSignals = signals.slice(0, 3);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'aiAssistant': navigate('/ai-chat'); break;
      case 'viewAnalyses': navigate('/analyses'); break;
      case 'viewSignals': navigate('/trades'); break;
      case 'gamification': navigate('/gamification'); break;
      case 'liveSession': navigate('/live'); break;
      default: break;
    }
  };

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Guest';

  return (
    <AppLayout>
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-0 end-0 w-96 h-96 rounded-full blur-3xl opacity-20" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)' }} />
        <div className="absolute bottom-32 start-0 w-64 h-64 rounded-full blur-3xl opacity-15" style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 0%, transparent 70%)' }} />
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

      {/* Admin Announcement Banner */}
      {announcementActive && announcementText && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative overflow-hidden border-b border-white/10"
          style={{ background: `linear-gradient(135deg, ${announcementColor}, ${announcementColor}dd, ${announcementColor}bb)` }}
        >
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
              animate={{ x: ['-150%', '400%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
            />
          </div>
          <div className="relative flex items-center gap-3 px-4 py-3">
            <motion.div
              animate={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
              className="shrink-0 bg-white/20 backdrop-blur-sm rounded-full p-1.5"
            >
              <Megaphone className="w-4 h-4 text-white drop-shadow-sm" />
            </motion.div>
            <div className="flex-1 overflow-hidden">
              <motion.p
                className="text-sm font-semibold text-white drop-shadow-sm whitespace-nowrap"
                animate={{ x: announcementText.length > 40 ? ['0%', '-50%'] : '0%' }}
                transition={announcementText.length > 40 ? { duration: 10, repeat: Infinity, repeatType: 'mirror', ease: 'linear' } : {}}
              >
                {announcementText}
              </motion.p>
            </div>
            <div className="shrink-0 w-2 h-2 rounded-full bg-white/60 animate-pulse" />
          </div>
        </motion.div>
      )}

      <div className="px-4 py-4 space-y-6 page-transition">

        {/* Welcome Section for logged-in users */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground">
                {isRTL ? `أهلاً ${displayName} 👋` : `Hello ${displayName} 👋`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isRTL ? 'ما الجديد في الأسواق اليوم؟' : "What's new in the markets today?"}
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className="w-6 h-6 text-primary/60" />
            </motion.div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">{t('home.quickActions')}</h2>
          <QuickActions isAdmin={isAdmin} onAction={handleQuickAction} />
        </motion.section>

        {/* Latest Signals */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-primary" />
              {isRTL ? 'آخر الإشارات' : 'Latest Signals'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/trades')} className="text-primary h-8 gap-1 hover:bg-primary/10">
              {t('home.viewAll')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
          <div className="space-y-2.5">
            {signalsLoading ? (
              <>
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </>
            ) : latestSignals.length > 0 ? (
              latestSignals.map((signal, index) => (
                <motion.div
                  key={signal.id}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.08 }}
                  onClick={() => navigate('/trades')}
                  className="cursor-pointer group"
                >
                  <div className="rounded-xl bg-card/60 border border-border/40 p-3.5 space-y-2 group-hover:border-primary/30 group-hover:bg-card/80 transition-all duration-200">
                    <div className="flex items-center gap-2">
                      {signal.symbol && (
                        <Badge variant="outline" className="font-mono text-xs bg-primary/10 border-primary/30 text-primary">
                          {signal.symbol}
                        </Badge>
                      )}
                      {signal.timeframe && <Badge variant="secondary" className="text-[10px]">{signal.timeframe}</Badge>}
                      <div className="flex-1" />
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true, locale })}
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug">{signal.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{signal.content}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{signal.likes_count || 0}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{signal.views_count || 0}</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground glass-card rounded-xl">
                {user ? (isRTL ? 'لا توجد إشارات حالياً' : 'No signals yet') : t('auth.loginPrompt')}
              </div>
            )}
          </div>
        </motion.section>

        {/* Latest Articles - Real Data */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              {isRTL ? 'آخر المقالات' : 'Latest Articles'}
            </h2>
            <Button variant="ghost" size="sm" onClick={() => navigate('/news')} className="text-primary h-8 gap-1 hover:bg-primary/10">
              {t('home.viewAll')}
              {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>
          <div className="space-y-2.5">
            {articlesLoading ? (
              <>
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </>
            ) : articles.length > 0 ? (
              articles.map((article, index) => {
                const title = isRTL ? article.title_ar : (article.title_en || article.title_ar);
                const summary = isRTL ? article.summary_ar : (article.summary_en || article.summary_ar);
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.08 }}
                    onClick={() => navigate(`/news/article/${article.id}`)}
                    className="cursor-pointer group"
                  >
                    <div className="rounded-xl bg-card/60 border border-border/40 p-3.5 group-hover:border-primary/30 group-hover:bg-card/80 transition-all duration-200">
                      <div className="flex gap-3">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt={title}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            loading="lazy"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="text-[10px]">{article.category}</Badge>
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(article.created_at), { addSuffix: true, locale })}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm line-clamp-2 leading-snug">{title}</h4>
                          {summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{summary}</p>}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-6 text-muted-foreground glass-card rounded-xl text-sm">
                {isRTL ? 'لا توجد مقالات حالياً' : 'No articles yet'}
              </div>
            )}
          </div>
        </motion.section>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-center text-xs text-muted-foreground px-4 py-3 rounded-xl glass-card">
          {t('disclaimer.text')}
        </motion.p>
      </div>
    </AppLayout>
  );
};

export default HomePage;
