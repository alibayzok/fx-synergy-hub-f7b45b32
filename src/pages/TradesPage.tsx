import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, Eye, Heart, Lock, Share2, LogIn, Crown } from 'lucide-react';
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

  const appName = getSetting('app_name', 'ASSASSIN FX');
  const locale = i18n.language === 'ar' ? ar : enUS;
  const isVipUser = isVip || isAdmin;

  const filteredSignals = signals.filter(s => {
    if (activeFilter === 'all') return true;
    return s.asset_type === activeFilter;
  });

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

  if (!user) {
    return (
      <AppLayout>
        <header className="sticky top-0 z-30 glass-card border-b border-border/30">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Radio className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{appName}</h1>
              <p className="text-xs text-muted-foreground">بث الإشارات</p>
            </div>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold">{t('auth.login')}</h2>
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
      <header className="sticky top-0 z-30 bg-gradient-to-b from-primary/10 to-background border-b border-border/30">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
            <Radio className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">{appName}</h1>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">VIP Signals</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {signals.length} منشور • بث مباشر
            </p>
          </div>
        </div>
        
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'forex', label: 'فوركس' },
            { key: 'crypto', label: 'كريبتو' },
            { key: 'metals', label: 'معادن' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                activeFilter === filter.key 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <div className="px-3 py-3 space-y-3 pb-24">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-card/50 p-4 space-y-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-40 w-full rounded-xl" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-4">
                <Skeleton className="h-6 w-12" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          ))
        ) : filteredSignals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Radio className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground">لا توجد إشارات حالياً</p>
            <p className="text-xs text-muted-foreground/60 mt-1">ترقب البث القادم...</p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSignals.map((post, index) => {
              const isLocked = post.visibility === 'vip' && !isVipUser;

              return (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ delay: index * 0.04 }}
                >
                  <div className="relative rounded-2xl bg-card/60 backdrop-blur-sm border border-border/40 overflow-hidden shadow-sm">
                    {post.visibility === 'vip' && (
                      <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 px-4 py-1.5 flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-medium text-amber-400">VIP</span>
                      </div>
                    )}

                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {post.symbol && (
                          <Badge variant="outline" className="font-mono text-xs bg-primary/10 border-primary/30 text-primary">
                            {post.symbol}
                          </Badge>
                        )}
                        {post.asset_type && (
                          <Badge variant="secondary" className="text-[10px]">
                            {post.asset_type === 'forex' ? 'فوركس' : post.asset_type === 'crypto' ? 'كريبتو' : 'معادن'}
                          </Badge>
                        )}
                        {post.timeframe && (
                          <Badge variant="outline" className="text-[10px]">{post.timeframe}</Badge>
                        )}
                      </div>

                      <h3 className="font-bold text-base leading-snug">{post.title}</h3>

                      {!isLocked && post.attachments && post.attachments.length > 0 && (
                        <div className={`${post.attachments.length === 1 ? '' : 'grid grid-cols-2 gap-1.5'}`}>
                          {post.attachments.map((url, imgIdx) => (
                            <div
                              key={imgIdx}
                              className="relative rounded-xl overflow-hidden bg-muted cursor-pointer group aspect-video"
                              onClick={() => setSelectedImage(url)}
                            >
                              <img src={url} alt={`Chart ${imgIdx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={`relative ${isLocked ? 'max-h-16 overflow-hidden' : ''}`}>
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                          {isLocked ? post.content.substring(0, 80) + '...' : post.content}
                        </p>
                        {isLocked && (
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex items-end justify-center pb-2">
                            <Button size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-xs h-7">
                              <Lock className="w-3 h-3 ml-1" />
                              ترقية لـ VIP
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => !isLocked && handleLike(post.id)}
                            disabled={isLocked}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                              likedPosts.has(post.id)
                                ? 'bg-red-500/15 text-red-500'
                                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${likedPosts.has(post.id) ? 'fill-current' : ''}`} />
                            {(post.likes_count || 0) > 0 && <span>{post.likes_count}</span>}
                          </button>
                          <button
                            onClick={() => handleShare(post)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-muted/50 text-muted-foreground hover:bg-muted transition-all"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{post.views_count || 0}</span>
                          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale })}</span>
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

      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-black/95 border-none">
          {selectedImage && (
            <img src={selectedImage} alt="Chart" className="w-full h-auto max-h-[85vh] object-contain rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default SignalsPage;
