import { useState } from 'react';
import { APP_URLS } from '@/config/environment';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift, ArrowLeft, Users, Trophy, Clock, CheckCircle2, XCircle, Send,
  Link2, Copy, Check, ArrowDownToLine, Crown, TrendingUp, Star, Medal, ChevronRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useReferrals } from '@/hooks/useReferrals';
import { useGamification } from '@/hooks/useGamification';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

type Tab = 'overview' | 'referrals' | 'rewards' | 'leaderboard' | 'history';

const TIERS = [
  { key: 'bronze', name_ar: 'برونزي', name_en: 'Bronze', icon: '🥉', min: 0, max: 9, color: 'from-orange-400 to-amber-600', bonus: 50 },
  { key: 'silver', name_ar: 'فضي', name_en: 'Silver', icon: '🥈', min: 10, max: 19, color: 'from-gray-300 to-gray-400', bonus: 60 },
  { key: 'gold', name_ar: 'ذهبي', name_en: 'Gold', icon: '🥇', min: 20, max: 49, color: 'from-yellow-400 to-amber-500', bonus: 75 },
  { key: 'diamond', name_ar: 'ماسي', name_en: 'Diamond', icon: '💎', min: 50, max: Infinity, color: 'from-cyan-400 to-blue-500', bonus: 100 },
];

const RewardsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { profile } = useProfile();
  const { myPoints } = useGamification();
  const {
    myReferrals, totalReferralPoints, rewards, myRedemptions,
    leaderboard, redeemReward, requestWithdrawal,
    referralCount, currentTier, getReferralTier,
  } = useReferrals();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refCopied, setRefCopied] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawPoints, setWithdrawPoints] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [confirmReward, setConfirmReward] = useState<any>(null);

  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode ? `${APP_URLS.production}/?ref=${referralCode}` : '';
  const currentPoints = myPoints?.total_points || 0;
  const MIN_REDEEM_POINTS = 1000;

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setRefCopied(true);
      toast({ title: isRTL ? 'تم نسخ رابط الإحالة' : 'Referral link copied' });
      setTimeout(() => setRefCopied(false), 2000);
    }
  };

  const handleRedeem = async () => {
    if (!confirmReward) return;
    if (currentPoints < MIN_REDEEM_POINTS) {
      toast({ title: isRTL ? `الحد الأدنى للاستبدال هو ${MIN_REDEEM_POINTS} نقطة` : `Minimum ${MIN_REDEEM_POINTS} points required`, variant: 'destructive' });
      return;
    }
    if (currentPoints < confirmReward.points_cost) {
      toast({ title: isRTL ? 'نقاطك غير كافية' : 'Insufficient points', variant: 'destructive' });
      return;
    }
    redeemReward.mutate({ rewardId: confirmReward.id, pointsCost: confirmReward.points_cost });
    setConfirmReward(null);
  };

  const handleWithdrawal = async () => {
    const pts = parseInt(withdrawPoints);
    if (!pts || pts < MIN_REDEEM_POINTS || pts > currentPoints) {
      toast({ title: isRTL ? `الحد الأدنى للسحب هو ${MIN_REDEEM_POINTS} نقطة` : `Minimum withdrawal is ${MIN_REDEEM_POINTS} points`, variant: 'destructive' });
      return;
    }
    requestWithdrawal.mutate({ points: pts, notes: withdrawNotes });
    setShowWithdrawal(false);
    setWithdrawPoints('');
    setWithdrawNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="text-amber-500 border-amber-500/30 gap-1"><Clock className="w-3 h-3" />{isRTL ? 'قيد المراجعة' : 'Pending'}</Badge>;
      case 'approved': return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />{isRTL ? 'موافق' : 'Approved'}</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive/30 gap-1"><XCircle className="w-3 h-3" />{isRTL ? 'مرفوض' : 'Rejected'}</Badge>;
      case 'delivered': return <Badge variant="outline" className="text-blue-500 border-blue-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />{isRTL ? 'تم التسليم' : 'Delivered'}</Badge>;
      default: return null;
    }
  };

  // Progress to next tier
  const tierProgress = currentTier.next
    ? ((referralCount - currentTier.min) / (currentTier.next - currentTier.min)) * 100
    : 100;

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: TrendingUp },
    { key: 'referrals', label: isRTL ? 'إحالاتي' : 'Referrals', icon: Users },
    { key: 'leaderboard', label: isRTL ? 'المتصدرون' : 'Top', icon: Trophy },
    { key: 'rewards', label: isRTL ? 'المكافآت' : 'Rewards', icon: Gift },
    { key: 'history', label: isRTL ? 'السجل' : 'History', icon: Clock },
  ];

  // My rank in leaderboard
  const myRank = user ? leaderboard.findIndex(l => l.user_id === user.id) + 1 : 0;

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Crown className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {isRTL ? 'الإحالات والمكافآت' : 'Referrals & Rewards'}
          </h1>
        </div>
      </header>

      {/* Tier Hero Card */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-2xl p-5 border border-border/30",
            "bg-gradient-to-br", currentTier.color, "bg-opacity-20"
          )}
          style={{ background: `linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--card)) 100%)` }}
        >
          {/* Tier gradient overlay */}
          <div className={cn("absolute inset-0 opacity-15 bg-gradient-to-br", currentTier.color)} />

          <div className="relative z-10 flex items-center gap-4">
            {/* Tier badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center text-3xl shadow-lg border border-border/20"
              style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--primary) / 0.05))` }}
            >
              {currentTier.icon}
            </motion.div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {isRTL ? currentTier.name_ar : currentTier.name_en}
                </span>
                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                  +{currentTier.bonus} {isRTL ? 'نقطة/إحالة' : 'pts/ref'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {referralCount} {isRTL ? 'إحالة' : 'referrals'}
              </p>

              {/* Progress to next tier */}
              {currentTier.next && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>{referralCount}/{currentTier.next}</span>
                    <span>
                      {isRTL ? 'المستوى التالي' : 'Next tier'}
                    </span>
                  </div>
                  <Progress value={tierProgress} className="h-1.5" />
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border/20">
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{referralCount}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? 'إحالات' : 'Referrals'}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-primary">{totalReferralPoints}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? 'نقاط مكتسبة' : 'Earned'}</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">{currentPoints}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? 'رصيدك' : 'Balance'}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Referral Link */}
      {referralCode && (
        <div className="px-4 pt-3">
          <div className="p-4 rounded-xl bg-card border border-primary/20 space-y-2">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">{isRTL ? 'رابط الإحالة' : 'Your Referral Link'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate" dir="ltr">
                {referralLink}
              </div>
              <Button variant="outline" size="sm" onClick={copyReferralLink} className="gap-1.5 h-9 shrink-0">
                {refCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                {refCopied ? (isRTL ? 'تم' : 'Copied') : (isRTL ? 'نسخ' : 'Copy')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-0.5 bg-muted/50 rounded-xl p-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-24 space-y-3">
        <AnimatePresence mode="wait">
          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Tier Progress Roadmap */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  {isRTL ? 'مستويات الإحالات' : 'Referral Tiers'}
                </h3>
                <div className="space-y-2">
                  {TIERS.map((tier, i) => {
                    const isActive = currentTier.key === tier.key;
                    const isCompleted = referralCount >= (tier.max === Infinity ? tier.min : tier.max + 1);
                    const isLocked = referralCount < tier.min;
                    return (
                      <motion.div
                        key={tier.key}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition-all",
                          isActive
                            ? "bg-primary/5 border-primary/30 shadow-sm"
                            : isCompleted
                              ? "bg-card border-border/50 opacity-70"
                              : "bg-card/50 border-border/30 opacity-50"
                        )}
                      >
                        <span className="text-2xl">{tier.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-sm font-semibold", isActive ? "text-primary" : "text-foreground")}>
                              {isRTL ? tier.name_ar : tier.name_en}
                            </span>
                            {isActive && (
                              <Badge className="text-[9px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                                {isRTL ? 'مستواك الحالي' : 'Current'}
                              </Badge>
                            )}
                            {isCompleted && !isActive && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {tier.min}+ {isRTL ? 'إحالة' : 'referrals'} • +{tier.bonus} {isRTL ? 'نقطة/إحالة' : 'pts/ref'}
                          </p>
                        </div>
                        {isLocked && (
                          <span className="text-[10px] text-muted-foreground">
                            {tier.min - referralCount} {isRTL ? 'متبقية' : 'more'}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 rounded-xl bg-card border border-border/50 text-center space-y-1"
                >
                  <Medal className="w-6 h-6 text-primary mx-auto" />
                  <p className="text-lg font-bold text-foreground">#{myRank || '—'}</p>
                  <p className="text-[10px] text-muted-foreground">{isRTL ? 'ترتيبك' : 'Your Rank'}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  className="p-4 rounded-xl bg-card border border-border/50 text-center space-y-1"
                >
                  <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto" />
                  <p className="text-lg font-bold text-foreground">
                    {myReferrals.filter(r => {
                      const d = new Date(r.created_at);
                      const now = new Date();
                      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{isRTL ? 'هذا الشهر' : 'This Month'}</p>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ═══ REFERRALS TAB ═══ */}
          {activeTab === 'referrals' && (
            <motion.div
              key="referrals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {myReferrals.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">{isRTL ? 'لا توجد إحالات بعد' : 'No referrals yet'}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'شارك رابطك لتبدأ بكسب النقاط' : 'Share your link to start earning'}</p>
                </div>
              ) : (
                myReferrals.map((ref, i) => (
                  <motion.div
                    key={ref.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                  >
                    <Avatar className="w-10 h-10 border-2 border-primary/20">
                      <AvatarImage src={ref.referred_profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {(ref.referred_profile?.display_name || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {ref.referred_profile?.display_name || (isRTL ? 'مستخدم' : 'User')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {ref.referred_profile?.username ? `@${ref.referred_profile.username}` : ''} • {new Date(ref.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en')}
                      </p>
                    </div>
                    <div className="text-end">
                      <span className="text-sm font-bold text-primary">+{ref.points_awarded}</span>
                      <Badge variant="outline" className="block mt-1 text-[9px] text-emerald-500 border-emerald-500/30">
                        {ref.status === 'completed' ? (isRTL ? 'مكتمل' : 'Active') : (isRTL ? 'معلّق' : 'Pending')}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* ═══ LEADERBOARD TAB ═══ */}
          {activeTab === 'leaderboard' && (
            <motion.div
              key="leaderboard"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {/* Top 3 podium */}
              {leaderboard.length >= 3 && (
                <div className="flex items-end justify-center gap-3 pb-4">
                  {[1, 0, 2].map((idx) => {
                    const entry = leaderboard[idx];
                    if (!entry) return null;
                    const isMe = entry.user_id === user?.id;
                    const medals = ['🥇', '🥈', '🥉'];
                    const heights = ['h-20', 'h-24', 'h-16'];
                    const order = [1, 0, 2];
                    return (
                      <motion.div
                        key={entry.user_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: order[idx] * 0.15 }}
                        className="flex flex-col items-center gap-1"
                      >
                        <div className="relative">
                          <Avatar className={cn("border-2", isMe ? "border-primary" : "border-border/50", idx === 0 ? "w-14 h-14" : "w-11 h-11")}>
                            <AvatarImage src={entry.profile?.avatar_url || ''} />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {(entry.profile?.display_name || '?')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="absolute -top-1 -end-1 text-sm">{medals[idx]}</span>
                        </div>
                        <p className={cn("text-[10px] font-medium truncate max-w-[70px] text-center", isMe ? "text-primary" : "text-foreground")}>
                          {entry.profile?.display_name || '—'}
                        </p>
                        <div className={cn(
                          "w-16 rounded-t-lg flex items-center justify-center text-xs font-bold",
                          heights[idx],
                          idx === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                        )}>
                          {entry.referral_count}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Full list */}
              {leaderboard.map((entry, i) => {
                const isMe = entry.user_id === user?.id;
                const tier = getReferralTier(entry.referral_count);
                return (
                  <motion.div
                    key={entry.user_id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border",
                      isMe ? "bg-primary/5 border-primary/30" : "bg-card border-border/50"
                    )}
                  >
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                      i < 3 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </span>
                    <Avatar className="w-9 h-9">
                      <AvatarImage src={entry.profile?.avatar_url || ''} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {(entry.profile?.display_name || '?')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium truncate", isMe ? "text-primary" : "text-foreground")}>
                        {entry.profile?.display_name || '—'}
                        {isMe && <span className="text-[10px] ms-1 text-muted-foreground">({isRTL ? 'أنت' : 'You'})</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {tier.icon} {isRTL ? tier.name_ar : tier.name_en}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-bold text-foreground">{entry.referral_count}</p>
                      <p className="text-[10px] text-muted-foreground">{entry.total_points} {isRTL ? 'نقطة' : 'pts'}</p>
                    </div>
                  </motion.div>
                );
              })}

              {leaderboard.length === 0 && (
                <div className="text-center py-12 space-y-2">
                  <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground">{isRTL ? 'لا توجد بيانات بعد' : 'No data yet'}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ REWARDS TAB ═══ */}
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setShowWithdrawal(true)}
                variant="outline"
                className="w-full gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
              >
                <ArrowDownToLine className="w-4 h-4" />
                {isRTL ? 'طلب سحب نقاط يدوي' : 'Manual Points Withdrawal'}
              </Button>

              {rewards.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Gift className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">{isRTL ? 'لا توجد مكافآت متاحة حالياً' : 'No rewards available yet'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {rewards.map((reward, i) => {
                    const canAfford = currentPoints >= reward.points_cost;
                    const outOfStock = reward.stock !== null && reward.stock <= 0;
                    return (
                      <motion.div
                        key={reward.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "p-4 rounded-xl border text-center space-y-2",
                          canAfford && !outOfStock ? "bg-card border-primary/20" : "bg-card/50 border-border/30 opacity-60"
                        )}
                      >
                        <span className="text-3xl">{reward.icon}</span>
                        <p className="font-semibold text-sm text-foreground">
                          {isRTL ? reward.name_ar : reward.name_en}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isRTL ? reward.description_ar : reward.description_en}
                        </p>
                        <p className="text-sm font-bold text-primary">{reward.points_cost} {isRTL ? 'نقطة' : 'pts'}</p>
                        {outOfStock ? (
                          <Badge variant="outline" className="text-destructive">{isRTL ? 'نفذت الكمية' : 'Out of stock'}</Badge>
                        ) : (
                          <Button
                            size="sm"
                            disabled={!canAfford}
                            onClick={() => setConfirmReward(reward)}
                            className="w-full text-xs"
                          >
                            {isRTL ? 'استبدال' : 'Redeem'}
                          </Button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ═══ HISTORY TAB ═══ */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-3"
            >
              {myRedemptions.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <Clock className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-muted-foreground text-sm">{isRTL ? 'لا توجد طلبات استبدال' : 'No redemptions yet'}</p>
                </div>
              ) : (
                myRedemptions.map((rd, i) => (
                  <motion.div
                    key={rd.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="p-3 rounded-xl bg-card border border-border/50 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {rd.reward ? (
                          <>
                            <span className="text-lg">{rd.reward.icon}</span>
                            <span className="text-sm font-medium text-foreground">
                              {isRTL ? rd.reward.name_ar : rd.reward.name_en}
                            </span>
                          </>
                        ) : (
                          <>
                            <ArrowDownToLine className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              {isRTL ? 'سحب يدوي' : 'Manual Withdrawal'}
                            </span>
                          </>
                        )}
                      </div>
                      {getStatusBadge(rd.status)}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(rd.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en')}</span>
                      <span className="font-bold text-destructive">-{rd.points_spent} {isRTL ? 'نقطة' : 'pts'}</span>
                    </div>
                    {rd.admin_notes && (
                      <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">{rd.admin_notes}</p>
                    )}
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Redeem Dialog */}
      <Dialog open={!!confirmReward} onOpenChange={() => setConfirmReward(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تأكيد الاستبدال' : 'Confirm Redemption'}</DialogTitle>
          </DialogHeader>
          {confirmReward && (
            <div className="text-center space-y-3 py-4">
              <span className="text-4xl">{confirmReward.icon}</span>
              <p className="font-semibold">{isRTL ? confirmReward.name_ar : confirmReward.name_en}</p>
              <p className="text-sm text-muted-foreground">{isRTL ? confirmReward.description_ar : confirmReward.description_en}</p>
              <p className="text-lg font-bold text-primary">{confirmReward.points_cost} {isRTL ? 'نقطة' : 'points'}</p>
              <p className="text-xs text-muted-foreground">
                {isRTL ? `رصيدك بعد الاستبدال: ${currentPoints - confirmReward.points_cost} نقطة` : `Balance after: ${currentPoints - confirmReward.points_cost} pts`}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmReward(null)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleRedeem} disabled={redeemReward.isPending}>{isRTL ? 'تأكيد الاستبدال' : 'Confirm'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Dialog */}
      <Dialog open={showWithdrawal} onOpenChange={setShowWithdrawal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isRTL ? 'طلب سحب نقاط' : 'Points Withdrawal Request'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              {isRTL ? `رصيدك الحالي: ${currentPoints} نقطة` : `Current balance: ${currentPoints} pts`}
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? 'عدد النقاط' : 'Points Amount'}</label>
              <Input
                type="number"
                value={withdrawPoints}
                onChange={(e) => setWithdrawPoints(e.target.value)}
                placeholder={isRTL ? 'أدخل عدد النقاط' : 'Enter points amount'}
                min={1}
                max={currentPoints}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
              <Textarea
                value={withdrawNotes}
                onChange={(e) => setWithdrawNotes(e.target.value)}
                placeholder={isRTL ? 'أضف تفاصيل طلبك...' : 'Add details about your request...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWithdrawal(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
            <Button onClick={handleWithdrawal} disabled={requestWithdrawal.isPending}>{isRTL ? 'إرسال الطلب' : 'Submit'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default RewardsPage;
