import { useState } from 'react';
import { APP_URLS } from '@/config/environment';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, History, Crown, ChevronRight, ArrowLeft, Link2, Copy, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useGamification, getLevelProgress, getNextLevelPoints } from '@/hooks/useGamification';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'badges' | 'leaderboard' | 'history';

const GamificationPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [refCopied, setRefCopied] = useState(false);
  const { myPoints, badges, myBadges, pointHistory, leaderboard, isLoading } = useGamification();
  const { profile } = useProfile();
  const { toast } = useToast();

  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode ? `${APP_URLS.production}/?ref=${referralCode}` : '';

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setRefCopied(true);
      toast({ title: isArabic ? 'تم نسخ رابط الإحالة' : 'Referral link copied' });
      setTimeout(() => setRefCopied(false), 2000);
    }
  };

  const currentPoints = myPoints?.total_points || 0;
  const currentLevel = myPoints?.level || 1;
  const levelName = isArabic ? (myPoints?.level_name_ar || 'مبتدئ') : (myPoints?.level_name_en || 'Beginner');
  const progress = getLevelProgress(currentPoints, currentLevel);
  const nextLevelPts = getNextLevelPoints(currentPoints, currentLevel);

  const earnedBadgeIds = new Set(myBadges.map((b: any) => b.badge_id));

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'overview', label: isArabic ? 'نظرة عامة' : 'Overview', icon: Star },
    { key: 'badges', label: isArabic ? 'الشارات' : 'Badges', icon: Award },
    { key: 'leaderboard', label: isArabic ? 'المتصدرين' : 'Leaderboard', icon: Crown },
    { key: 'history', label: isArabic ? 'السجل' : 'History', icon: History },
  ];

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-30 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-muted">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <Trophy className="w-5 h-5 text-primary" />
          <h1 className="text-xl font-bold text-foreground">
            {isArabic ? 'النقاط والتصنيفات' : 'Points & Rankings'}
          </h1>
        </div>
      </header>

      {/* Level Card */}
      <div className="px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">{isArabic ? 'مستواك الحالي' : 'Your Level'}</p>
              <h2 className="text-2xl font-bold text-foreground">
                {levelName}
              </h2>
            </div>
            <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{currentPoints} {isArabic ? 'نقطة' : 'pts'}</span>
              <span className="text-muted-foreground">{nextLevelPts} {isArabic ? 'نقطة' : 'pts'}</span>
            </div>
            <Progress value={progress} className="h-2.5" />
            <p className="text-xs text-muted-foreground text-center">
              {isArabic
                ? `${nextLevelPts - currentPoints} نقطة للمستوى التالي`
                : `${nextLevelPts - currentPoints} pts to next level`}
            </p>
          </div>
        </motion.div>
      </div>

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

      {/* Tab Content */}
      <div className="px-4 py-4 pb-24 space-y-3">
        {activeTab === 'overview' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: isArabic ? 'النقاط' : 'Points', value: currentPoints, icon: '💎' },
                { label: isArabic ? 'المستوى' : 'Level', value: currentLevel, icon: '⭐' },
                { label: isArabic ? 'الشارات' : 'Badges', value: myBadges.length, icon: '🏅' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 rounded-xl bg-card border border-border/50 text-center"
                >
                  <span className="text-lg">{stat.icon}</span>
                  <p className="text-lg font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            {/* How to earn */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <h3 className="font-semibold text-foreground mb-3">
                {isArabic ? 'كيف تكسب نقاط؟' : 'How to earn points?'}
              </h3>
              <div className="space-y-2.5">
                {[
                  { action: isArabic ? 'إرسال رسالة في الغرفة' : 'Send a room message', pts: '+2' },
                  { action: isArabic ? 'نشر منشور' : 'Create a post', pts: '+10' },
                  { action: isArabic ? 'حصول منشورك على إعجاب' : 'Get a like on your post', pts: '+3' },
                  { action: isArabic ? 'دعوة صديق (Referral)' : 'Refer a friend', pts: '+50' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.action}</span>
                    <span className="text-sm font-bold text-primary">{item.pts}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Referral Link */}
            {referralCode && (
              <div className="p-4 rounded-xl bg-card border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-foreground text-sm">
                    {isArabic ? 'رابط الإحالة الخاص بك' : 'Your Referral Link'}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isArabic ? 'شارك الرابط واكسب 50 نقطة لكل صديق يسجل' : 'Share and earn 50 pts for each friend who signs up'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate" dir="ltr">
                    {referralLink}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyReferralLink} className="gap-1.5 h-9 shrink-0">
                    {refCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {refCopied ? (isArabic ? 'تم' : 'Copied') : (isArabic ? 'نسخ' : 'Copy')}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'badges' && (
          <div className="grid grid-cols-2 gap-3">
            {badges.map((badge, i) => {
              const earned = earnedBadgeIds.has(badge.id);
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    'p-4 rounded-xl border text-center',
                    earned
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card border-border/50 opacity-60'
                  )}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="font-semibold text-foreground mt-2 text-sm">
                    {isArabic ? badge.name_ar : badge.name_en}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {badge.points_required > 0
                      ? `${badge.points_required} ${isArabic ? 'نقطة' : 'pts'}`
                      : isArabic ? 'إنجاز خاص' : 'Special achievement'}
                  </p>
                  {earned && (
                    <span className="inline-block mt-2 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                      ✅ {isArabic ? 'مكتسبة' : 'Earned'}
                    </span>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border',
                  i < 3 ? 'bg-primary/5 border-primary/20' : 'bg-card border-border/50',
                  entry.user_id === user?.id && 'ring-2 ring-primary/50'
                )}
              >
                <div className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  i === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                  i === 1 ? 'bg-gray-400/20 text-gray-400' :
                  i === 2 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-muted text-muted-foreground'
                )}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                </div>
                <Avatar className="w-8 h-8">
                  <AvatarImage src={entry.avatar_url || ''} />
                  <AvatarFallback className="text-xs">
                    {(entry.display_name || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {entry.display_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isArabic ? entry.level_name_ar : entry.level_name_en}
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {entry.total_points}
                </span>
              </motion.div>
            ))}
            {leaderboard.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {isArabic ? 'لا توجد بيانات بعد' : 'No data yet'}
              </p>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {pointHistory.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50"
              >
                <div>
                  <p className="text-sm text-foreground">
                    {isArabic ? tx.description_ar : tx.description_en}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(tx.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en')}
                  </p>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  tx.points > 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {tx.points > 0 ? '+' : ''}{tx.points}
                </span>
              </motion.div>
            ))}
            {pointHistory.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {isArabic ? 'لا توجد سجلات بعد. ابدأ بالتفاعل لكسب نقاط!' : 'No history yet. Start interacting to earn points!'}
              </p>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GamificationPage;
