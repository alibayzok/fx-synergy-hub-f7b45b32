import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Gift, ArrowLeft, Users, Trophy, Clock, CheckCircle2, XCircle, Send, Link2, Copy, Check, ArrowDownToLine } from 'lucide-react';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

type Tab = 'referrals' | 'rewards' | 'history';

const RewardsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { profile } = useProfile();
  const { myPoints } = useGamification();
  const { myReferrals, totalReferralPoints, rewards, myRedemptions, redeemReward, requestWithdrawal } = useReferrals();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>('referrals');
  const [refCopied, setRefCopied] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [withdrawPoints, setWithdrawPoints] = useState('');
  const [withdrawNotes, setWithdrawNotes] = useState('');
  const [confirmReward, setConfirmReward] = useState<any>(null);

  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode ? `https://fx-synergy-hub.lovable.app/?ref=${referralCode}` : '';
  const currentPoints = myPoints?.total_points || 0;

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
    if (currentPoints < confirmReward.points_cost) {
      toast({ title: isRTL ? 'نقاطك غير كافية' : 'Insufficient points', variant: 'destructive' });
      return;
    }
    redeemReward.mutate({ rewardId: confirmReward.id, pointsCost: confirmReward.points_cost });
    setConfirmReward(null);
  };

  const handleWithdrawal = async () => {
    const pts = parseInt(withdrawPoints);
    if (!pts || pts <= 0 || pts > currentPoints) {
      toast({ title: isRTL ? 'عدد نقاط غير صالح' : 'Invalid points amount', variant: 'destructive' });
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
      case 'approved': return <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />{isRTL ? 'موافق عليه' : 'Approved'}</Badge>;
      case 'rejected': return <Badge variant="outline" className="text-destructive border-destructive/30 gap-1"><XCircle className="w-3 h-3" />{isRTL ? 'مرفوض' : 'Rejected'}</Badge>;
      case 'delivered': return <Badge variant="outline" className="text-blue-500 border-blue-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />{isRTL ? 'تم التسليم' : 'Delivered'}</Badge>;
      default: return null;
    }
  };

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'referrals', label: isRTL ? 'إحالاتي' : 'My Referrals', icon: Users },
    { key: 'rewards', label: isRTL ? 'المكافآت' : 'Rewards', icon: Gift },
    { key: 'history', label: isRTL ? 'السجل' : 'History', icon: Clock },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Gift className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {isRTL ? 'الإحالات والمكافآت' : 'Referrals & Rewards'}
          </h1>
        </div>
      </header>

      {/* Stats Card */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-foreground">{myReferrals.length}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? 'إحالات' : 'Referrals'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{totalReferralPoints}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? 'نقاط مكتسبة' : 'Points Earned'}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{currentPoints}</p>
              <p className="text-[10px] text-muted-foreground">{isRTL ? 'رصيدك' : 'Your Balance'}</p>
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
            <p className="text-[10px] text-muted-foreground">{isRTL ? 'اكسب 50 نقطة لكل صديق يسجل عبر رابطك' : 'Earn 50 points for each friend who signs up'}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all',
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
        {activeTab === 'referrals' && (
          <>
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
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={ref.referred_profile?.avatar_url || ''} />
                    <AvatarFallback className="text-xs">
                      {(ref.referred_profile?.display_name || '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {ref.referred_profile?.display_name || (isRTL ? 'مستخدم' : 'User')}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(ref.created_at).toLocaleDateString(isRTL ? 'ar-EG' : 'en')}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-primary">+{ref.points_awarded}</span>
                </motion.div>
              ))
            )}
          </>
        )}

        {activeTab === 'rewards' && (
          <>
            {/* Withdrawal button */}
            <Button
              onClick={() => setShowWithdrawal(true)}
              variant="outline"
              className="w-full gap-2 rounded-xl border-primary/30 text-primary hover:bg-primary/5"
            >
              <ArrowDownToLine className="w-4 h-4" />
              {isRTL ? 'طلب سحب نقاط يدوي' : 'Manual Points Withdrawal'}
            </Button>

            {/* Rewards catalog */}
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
          </>
        )}

        {activeTab === 'history' && (
          <>
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
          </>
        )}
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
