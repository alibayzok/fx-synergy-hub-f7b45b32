import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, ArrowDown, Crown, Users, Clock, X, Share2, 
  MessageCircle, Heart, Copy, Send, ExternalLink,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Trade {
  id: string;
  symbol: string;
  asset_type: 'forex' | 'metals' | 'crypto';
  direction: 'buy' | 'sell';
  entry_type: 'market' | 'limit' | 'stop';
  entry_price: number;
  sl_price: number;
  tp_prices: number[];
  timeframe: string;
  status: string;
  visibility: 'free' | 'vip';
  reason: string;
  risk_note?: string;
  alternative_scenario?: string;
  last_update_note?: string;
  followers_count: number | null;
  created_at: string;
  created_by: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user?: {
    display_name: string;
  };
}

interface TradeDetailSheetProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tp_hit: 'bg-profit/20 text-profit border-profit/30',
  sl_hit: 'bg-loss/20 text-loss border-loss/30',
  cancelled: 'bg-muted text-muted-foreground border-border',
  closed_manual: 'bg-muted text-muted-foreground border-border',
};

export const TradeDetailSheet = ({ trade, open, onOpenChange }: TradeDetailSheetProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (trade && open) {
      setFollowersCount(trade.followers_count || 0);
      checkFollowStatus();
      fetchComments();
    }
  }, [trade, open]);

  const checkFollowStatus = async () => {
    if (!trade || !user) return;
    
    const { data } = await supabase
      .from('trade_followers')
      .select('id')
      .eq('trade_id', trade.id)
      .eq('user_id', user.id)
      .single();
    
    setIsFollowing(!!data);
  };

  const fetchComments = async () => {
    if (!trade) return;
    
    const { data } = await supabase
      .from('trade_comments')
      .select(`
        id,
        user_id,
        content,
        likes_count,
        created_at
      `)
      .eq('trade_id', trade.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      // Fetch user profiles separately
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles_public')
        .select('user_id, display_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      setComments(data.map(c => ({
        ...c,
        user: profileMap.get(c.user_id) as { display_name: string } | undefined
      })));
    }
  };

  const handleFollow = async () => {
    if (!trade || !user) return;
    
    setLoading(true);
    
    if (isFollowing) {
      await supabase
        .from('trade_followers')
        .delete()
        .eq('trade_id', trade.id)
        .eq('user_id', user.id);
      
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
      toast({ title: t('trades.following'), description: 'تم إلغاء المتابعة' });
    } else {
      await supabase
        .from('trade_followers')
        .insert({ trade_id: trade.id, user_id: user.id });
      
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
      toast({ title: t('trades.following'), description: 'تمت المتابعة بنجاح' });
    }
    
    setLoading(false);
  };

  const handleAddComment = async () => {
    if (!trade || !user || !newComment.trim()) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('trade_comments')
      .insert({
        trade_id: trade.id,
        user_id: user.id,
        content: newComment.trim()
      });
    
    if (!error) {
      setNewComment('');
      fetchComments();
      toast({ title: 'تمت الإضافة', description: 'تم نشر تعليقك' });
    }
    
    setLoading(false);
  };

  const handleShare = async (type: 'copy' | 'telegram' | 'whatsapp') => {
    if (!trade) return;
    
    const shareText = `📊 ${trade.symbol} | ${trade.direction === 'buy' ? '🟢 شراء' : '🔴 بيع'}
💰 دخول: ${trade.entry_price}
🛑 وقف: ${trade.sl_price}
🎯 هدف: ${trade.tp_prices.join(', ')}
📝 ${trade.reason}`;

    const shareUrl = `${window.location.origin}/trades/${trade.id}`;

    // Log share for analytics
    await supabase.from('trade_shares').insert({
      trade_id: trade.id,
      user_id: user?.id || '',
      share_type: type
    });

    if (type === 'copy') {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      toast({ title: 'تم النسخ', description: 'تم نسخ تفاصيل الصفقة' });
    } else if (type === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`, '_blank');
    }
    
    setShowShareMenu(false);
  };

  if (!trade) return null;

  const isBuy = trade.direction === 'buy';
  const isVip = trade.visibility === 'vip';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0 overflow-hidden">
        {/* Header */}
        <SheetHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-xl",
                isBuy ? "bg-profit/20" : "bg-loss/20"
              )}>
                {isBuy ? (
                  <ArrowUp className="w-6 h-6 text-profit" />
                ) : (
                  <ArrowDown className="w-6 h-6 text-loss" />
                )}
              </div>
              <div>
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  {trade.symbol}
                  {isVip && (
                    <Badge variant="outline" className="bg-vip text-vip-foreground border-vip gap-1 text-xs">
                      <Crown className="w-3 h-3" />
                      VIP
                    </Badge>
                  )}
                </SheetTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className={isBuy ? "text-profit" : "text-loss"}>
                    {t(`trades.${trade.direction}`)}
                  </span>
                  <span>•</span>
                  <span>{trade.timeframe}</span>
                  <span>•</span>
                  <Badge variant="outline" className={cn("text-xs", statusColors[trade.status])}>
                    {t(`trades.${trade.status}`)}
                  </Badge>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-80px)] pb-24">
          {/* Price Levels */}
          <div className="grid grid-cols-3 gap-3 p-4">
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t('trades.entry')}</p>
              <p className="trading-number text-lg font-bold text-foreground">
                {trade.entry_price.toLocaleString('en-US')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t(`trades.${trade.entry_type}`)}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-loss/10 border border-loss/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t('trades.stopLoss')}</p>
              <p className="trading-number text-lg font-bold text-loss">
                {trade.sl_price.toLocaleString('en-US')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-profit/10 border border-profit/30 text-center">
              <p className="text-xs text-muted-foreground mb-1">{t('trades.takeProfit')}</p>
              <div className="space-y-1">
                {trade.tp_prices.map((tp, i) => (
                  <p key={i} className="trading-number text-sm font-bold text-profit">
                    TP{i + 1}: {tp.toLocaleString('en-US')}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Reason */}
          <div className="px-4 pb-4">
            <h3 className="text-sm font-medium text-foreground mb-2">{t('trades.reason')}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed p-3 rounded-lg bg-muted/30">
              {trade.reason}
            </p>
          </div>

          {/* Risk Note */}
          {trade.risk_note && (
            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-foreground mb-2">{t('trades.risk')}</h3>
              <p className="text-sm text-loss leading-relaxed p-3 rounded-lg bg-loss/10 border border-loss/30">
                {trade.risk_note}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 px-4 pb-4">
            <Button
              variant={isFollowing ? "default" : "outline"}
              className={cn(
                "flex-1 gap-2",
                isFollowing && "bg-primary"
              )}
              onClick={handleFollow}
              disabled={loading || !user}
            >
              {isFollowing ? <CheckCircle2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
              {isFollowing ? t('trades.following') : t('trades.follow')}
              <span className="trading-number">({followersCount})</span>
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowShareMenu(!showShareMenu)}
              >
                <Share2 className="w-4 h-4" />
              </Button>
              
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute bottom-full end-0 mb-2 p-2 rounded-xl bg-card border border-border shadow-xl min-w-[140px]"
                  >
                    <button
                      onClick={() => handleShare('copy')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      نسخ الرابط
                    </button>
                    <button
                      onClick={() => handleShare('telegram')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      تيليجرام
                    </button>
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      واتساب
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Separator className="my-2" />

          {/* Comments Section */}
          <div className="px-4 py-4">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" />
              {t('trades.discussion')}
              <span className="text-muted-foreground trading-number">({comments.length})</span>
            </h3>

            {/* Comment Input */}
            {user && (
              <div className="flex gap-2 mb-4">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="اكتب تعليقك..."
                  className="min-h-[60px] resize-none"
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={loading || !newComment.trim()}
                  className="shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3">
              {comments.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">
                  لا توجد تعليقات بعد، كن أول من يعلق!
                </p>
              ) : (
                comments.map((comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex items-start gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {comment.user?.display_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">
                            {comment.user?.display_name || 'مستخدم'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString('ar')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                            <Heart className="w-3.5 h-3.5" />
                            <span className="trading-number">{comment.likes_count}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
