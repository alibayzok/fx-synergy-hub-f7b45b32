import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Eye, Heart, Lock, Share2, LogIn, Crown, Zap, 
  TrendingUp, Clock, Sparkles, Shield, ChevronDown
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useSignals } from '@/hooks/useSignals';
import { useAuth } from '@/hooks/useAuth';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

const SignalsPage = () => {
  const { t, i18n } = useTranslation();
  const { signals, loading, likeSignal, unlikeSignal } = useSignals();
  const { user, isVip, isAdmin } = useAuth();
  const { getSetting } = useAppSettings();
  const navigate = useNavigate();
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'vip'>('all');

  const appName = getSetting('app_name', 'ASSASSIN FX');
  const locale = i18n.language === 'ar' ? ar : enUS;
  const isVipUser = isVip || isAdmin;

  const filteredSignals = useMemo(() => {
    let filtered = signals;
    if (activeTab === 'vip') {
      filtered = filtered.filter(s => s.visibility === 'vip');
    }
    if (activeFilter !== 'all') {
      filtered = filtered.filter(s => s.asset_type === activeFilter);
    }
    return filtered;
  }, [signals, activeTab, activeFilter]);

  const vipCount = signals.filter(s => s.visibility === 'vip').length;
  const freeCount = signals.filter(s => s.visibility === 'free').length;

  const handleLike = async (id: string) => {
    if (likedPosts.has(id)) {
      await unlikeSignal(id);
      setLikedPosts(prev => { const s = new Set(prev); s.delete(id); return s; });
    } else {
      await likeSignal(id);
      setLikedPosts(prev => new Set(prev).add(id));
    }
  };

  const handleShare = (signal: { title: string; content: string }) => {
    const text = `${signal.title}\n${signal.content.substring(0, 100)}...`;
    if (navigator.share) {
      navigator.share({ title: signal.title, text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  // Login prompt
  if (!user) {
    return (
      <AppLayout>
        <div className="min-h-screen flex flex-col">
          {/* Premium header even for logged out */}
          <header className="sticky top-0 z-30 border-b border-border/20" style={{
            background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--background)) 100%)',
            backdropFilter: 'blur(20px)',
          }}>
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg" style={{
                  boxShadow: '0 0 20px hsl(var(--primary) / 0.3)',
                }}>
                  <Radio className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-profit rounded-full border-2 border-background animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold gold-gradient">إشارات {appName}</h1>
                <p className="text-xs text-muted-foreground">بث مباشر للإشارات الاحترافية</p>
              </div>
            </div>
          </header>

          <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center border border-primary/20">
                <Lock className="w-12 h-12 text-primary/60" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
            </motion.div>
            <div className="text-center space-y-3 max-w-xs">
              <h2 className="text-2xl font-bold">{t('auth.login')}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">سجل دخولك للوصول إلى إشارات التداول الاحترافية في الوقت الحقيقي</p>
            </div>
            <Button onClick={() => navigate('/auth')} size="lg" className="gap-2 px-8 shadow-lg" style={{
              boxShadow: '0 4px 20px hsl(var(--primary) / 0.3)',
            }}>
              <LogIn className="w-5 h-5" />
              {t('auth.login')}
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* ═══════════ Premium Channel Header ═══════════ */}
      <header className="sticky top-0 z-30 border-b border-primary/10" style={{
        background: 'linear-gradient(180deg, hsl(var(--card) / 0.98) 0%, hsl(var(--background) / 0.95) 100%)',
        backdropFilter: 'blur(20px)',
      }}>
        {/* Channel info */}
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-xl" style={{
              boxShadow: '0 4px 24px hsl(var(--primary) / 0.35)',
            }}>
              <Radio className="w-7 h-7 text-primary-foreground" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-profit rounded-full border-2 border-background flex items-center justify-center">
              <Zap className="w-3 h-3 text-profit-foreground" />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold gold-gradient">{appName}</h1>
              <Badge className="bg-gradient-to-r from-primary/20 to-accent/20 text-primary border-primary/30 text-[10px] px-2 py-0 font-semibold">
                <Zap className="w-3 h-3 mr-0.5" />
                LIVE
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {signals.length} إشارة • {freeCount} مجانية • {vipCount} VIP
            </p>
          </div>
        </div>

        {/* Tab switcher - All / VIP */}
        <div className="px-4 pb-2 flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'all'
                ? 'bg-primary/15 text-primary border border-primary/30 shadow-sm'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            جميع الإشارات
            <Badge variant="secondary" className="text-[10px] px-1.5 h-4">{signals.length}</Badge>
          </button>
          <button
            onClick={() => setActiveTab('vip')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'vip'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-500 border border-amber-500/30 shadow-sm'
                : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
            }`}
          >
            <Crown className="w-4 h-4" />
            VIP حصري
            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] px-1.5 h-4">{vipCount}</Badge>
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'الكل', icon: null },
            { key: 'forex', label: '💱 فوركس' },
            { key: 'crypto', label: '₿ كريبتو' },
            { key: 'metals', label: '🥇 معادن' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap border ${
                activeFilter === filter.key 
                  ? 'bg-primary text-primary-foreground shadow-md border-primary/50' 
                  : 'bg-card/60 text-muted-foreground hover:bg-muted/60 border-border/40'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {/* ═══════════ VIP Upgrade Banner (for non-VIP on VIP tab) ═══════════ */}
      {activeTab === 'vip' && !isVipUser && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3 mt-3 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, hsl(38 100% 20%) 0%, hsl(45 100% 15%) 50%, hsl(38 100% 20%) 100%)',
            border: '1px solid hsl(45 100% 50% / 0.3)',
          }}
        >
          <div className="p-5 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center shadow-xl" style={{
              boxShadow: '0 0 30px hsl(45 100% 50% / 0.4)',
            }}>
              <Crown className="w-8 h-8 text-black" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-100">ترقية إلى VIP</h3>
              <p className="text-sm text-amber-200/70 mt-1">احصل على إشارات حصرية من أفضل المحللين بنسبة نجاح عالية</p>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-amber-300/80">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> إشارات محمية</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" /> أولوية الوصول</span>
              <span className="flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> تحليلات عميقة</span>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold hover:from-amber-500 hover:to-yellow-600 shadow-lg px-6">
              <Crown className="w-4 h-4 mr-1" />
              اشترك الآن
            </Button>
          </div>
        </motion.div>
      )}

      {/* ═══════════ Broadcast Messages Feed ═══════════ */}
      <div className="px-3 py-3 space-y-3 pb-24">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card/50 p-4 space-y-3 border border-border/20">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-12 rounded-full" />
              </div>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-10 rounded-full" />
              </div>
            </div>
          ))
        ) : filteredSignals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-muted/50 flex items-center justify-center mb-4">
              <Radio className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <p className="text-muted-foreground font-medium">
              {activeTab === 'vip' ? 'لا توجد إشارات VIP حالياً' : 'لا توجد إشارات حالياً'}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">ترقب البث القادم...</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSignals.map((post, index) => {
              const isLocked = post.visibility === 'vip' && !isVipUser;
              const isVipSignal = post.visibility === 'vip';

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05, type: 'spring', damping: 25 }}
                >
                  <div
                    className={`relative rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${
                      isVipSignal
                        ? 'border border-amber-500/25'
                        : 'border border-border/30'
                    }`}
                    style={{
                      background: isVipSignal
                        ? 'linear-gradient(145deg, hsl(var(--card) / 0.95) 0%, hsl(38 100% 50% / 0.03) 100%)'
                        : 'linear-gradient(145deg, hsl(var(--card) / 0.9) 0%, hsl(var(--card) / 0.7) 100%)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    {/* VIP Header Strip */}
                    {isVipSignal && (
                      <div className="flex items-center gap-2 px-4 py-2" style={{
                        background: 'linear-gradient(90deg, hsl(45 100% 50% / 0.12) 0%, hsl(38 100% 40% / 0.06) 100%)',
                        borderBottom: '1px solid hsl(45 100% 50% / 0.1)',
                      }}>
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 tracking-wide">VIP SIGNAL</span>
                        <div className="flex-1" />
                        <Shield className="w-3 h-3 text-amber-400/60" />
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      {/* Badges row */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.symbol && (
                          <Badge className="font-mono text-xs bg-primary/15 text-primary border border-primary/30 font-bold tracking-wider px-2.5">
                            {post.symbol}
                          </Badge>
                        )}
                        {post.asset_type && (
                          <Badge variant="secondary" className="text-[10px] font-medium">
                            {post.asset_type === 'forex' ? '💱 فوركس' : post.asset_type === 'crypto' ? '₿ كريبتو' : '🥇 معادن'}
                          </Badge>
                        )}
                        {post.timeframe && (
                          <Badge variant="outline" className="text-[10px] font-medium bg-muted/30">
                            <Clock className="w-3 h-3 mr-0.5" />
                            {post.timeframe}
                          </Badge>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-bold text-[15px] leading-snug text-foreground">{post.title}</h3>

                      {/* Chart images - Premium gallery */}
                      {!isLocked && post.attachments && post.attachments.length > 0 && (
                        <div className={`${
                          post.attachments.length === 1 
                            ? '' 
                            : post.attachments.length === 2 
                              ? 'grid grid-cols-2 gap-1.5' 
                              : 'grid grid-cols-2 gap-1.5'
                        }`}>
                          {post.attachments.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              className={`relative rounded-xl overflow-hidden bg-muted/50 cursor-pointer group ${
                                post.attachments!.length === 1 ? 'aspect-[16/10]' : 'aspect-video'
                              }`}
                              onClick={() => setSelectedImage(url)}
                            >
                              <img
                                src={url}
                                alt={`Chart ${imgIdx + 1}`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Content */}
                      <div className={`relative ${isLocked ? 'max-h-20 overflow-hidden' : ''}`}>
                        <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-wrap">
                          {isLocked ? post.content.substring(0, 100) + '...' : post.content}
                        </p>
                        {isLocked && (
                          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1" style={{
                            background: 'linear-gradient(to top, hsl(var(--card)) 20%, hsl(var(--card) / 0.8) 60%, transparent 100%)',
                          }}>
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black text-xs h-8 font-bold shadow-lg gap-1.5 px-4"
                              style={{ boxShadow: '0 4px 16px hsl(45 100% 50% / 0.3)' }}
                            >
                              <Lock className="w-3.5 h-3.5" />
                              فتح بالترقية لـ VIP
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Footer - Premium reactions bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-border/20">
                        <div className="flex items-center gap-1.5">
                          {/* Like button */}
                          <button
                            onClick={() => !isLocked && handleLike(post.id)}
                            disabled={isLocked}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              likedPosts.has(post.id)
                                ? 'bg-red-500/15 text-red-400 border border-red-500/20'
                                : 'bg-muted/40 text-muted-foreground hover:bg-muted/70 border border-transparent'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                            {(post.likes_count || 0) > 0 && <span>{post.likes_count}</span>}
                          </button>

                          {/* Share */}
                          <button
                            onClick={() => handleShare(post)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-muted/40 text-muted-foreground hover:bg-muted/70 transition-all border border-transparent"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Meta info */}
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {post.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ═══════════ Image Lightbox ═══════════ */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-1 border-none" style={{
          background: 'hsl(0 0% 0% / 0.95)',
        }}>
          {selectedImage && (
            <img src={selectedImage} alt="Chart" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SignalsPage;
