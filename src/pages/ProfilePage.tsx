import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Link2, Copy, Check as CheckIcon2 } from 'lucide-react';
import { 
  Settings, 
  Globe, 
  Bell, 
  Crown, 
  Star, 
  TrendingUp, 
  LogOut,
  LogIn,
  ChevronRight,
  Check,
  Shield,
  Edit,
  X,
  Camera,
  Loader2,
  Trash2,
  ZoomIn,
  Headset,
  Ban,
  ShieldAlert,
  UserX,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useMarketData } from '@/hooks/useMarketData';
import { countries } from '@/data/countries';
import { useToast } from '@/hooks/use-toast';
import { NotificationSettings } from '@/components/notifications/NotificationSettings';
import { FriendsSection } from '@/components/profile/FriendsSection';
import { UserPostsSection } from '@/components/profile/UserPostsSection';
import { useSupport } from '@/hooks/useSupport';
import { useBlockUser } from '@/hooks/useBlockUser';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PremiumImageViewer } from '@/components/ui/premium-image-viewer';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isModerator, isSupport, isVip, signOut, loading } = useAuth();
  const { profile, updateProfile, uploadAvatar, uploadingAvatar, deleteAvatar } = useProfile();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const { watchlist } = useMarketData();
  const { isSupportAgent } = useSupport();
  const { blockedUsers, unblockUser, loading: blockLoading } = useBlockUser();
  
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showWatchlistDialog, setShowWatchlistDialog] = useState(false);
  const [showFollowedDialog, setShowFollowedDialog] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [showBlockedUsers, setShowBlockedUsers] = useState(false);
  const [refCopied, setRefCopied] = useState(false);
  
  const [editData, setEditData] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    country: '',
    phone: ''
  });

  const isRTL = i18n.language === 'ar';
  const referralCode = profile?.referral_code || '';
  const referralLink = referralCode ? `https://fx-synergy-hub.lovable.app/?ref=${referralCode}` : '';

  const copyReferralLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setRefCopied(true);
      toast({ title: isRTL ? 'تم نسخ رابط الإحالة' : 'Referral link copied' });
      setTimeout(() => setRefCopied(false), 2000);
    }
  };

  useEffect(() => {
    if (profile) {
      setEditData({
        display_name: profile.display_name || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        country: profile.country || '',
        phone: profile.phone || ''
      });
    }
  }, [profile]);

  const changeLanguage = (lng: 'ar' | 'en') => {
    i18n.changeLanguage(lng);
    setShowLanguageDialog(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    const { error } = await updateProfile(editData);
    if (!error) {
      setShowEditDialog(false);
    }
  };

  const menuItems = [
    { icon: MessageSquare, label: 'messages.title', onClick: () => navigate('/messages') },
    { icon: Globe, label: 'profile.language', onClick: () => setShowLanguageDialog(true), value: i18n.language === 'ar' ? 'العربية' : 'English' },
    { icon: Bell, label: 'profile.notifications', onClick: () => setShowNotificationSettings(true) },
    { icon: Star, label: 'profile.watchlist', onClick: () => setShowWatchlistDialog(true), count: watchlist.length },
  ];

  // Show login prompt if not authenticated
  if (!loading && !user) {
    return (
      <AppLayout>
        <header className="sticky top-0 z-40 glass-card border-b border-border/30">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{t('auth.login')}</h2>
            <p className="text-muted-foreground">{t('auth.loginPrompt')}</p>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('auth.login')}
          </Button>
        </div>

        {/* Language Dialog */}
        <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
          <DialogContent className="sm:max-w-[300px]">
            <DialogHeader>
              <DialogTitle>{t('profile.language')}</DialogTitle>
              <DialogDescription className="sr-only">Select language</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => changeLanguage('ar')}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                  i18n.language === 'ar' 
                    ? "bg-primary/10 border-primary/30" 
                    : "border-border/30 hover:bg-muted"
                )}
              >
                <span className="font-medium">العربية</span>
                {i18n.language === 'ar' && <Check className="w-4 h-4 text-primary" />}
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                  i18n.language === 'en' 
                    ? "bg-primary/10 border-primary/30" 
                    : "border-border/30 hover:bg-muted"
                )}
              >
                <span className="font-medium">English</span>
                {i18n.language === 'en' && <Check className="w-4 h-4 text-primary" />}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </AppLayout>
    );
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0];
  const initials = displayName?.charAt(0).toUpperCase() || 'U';

  return (
    <AppLayout showNotifications={false}>
      {/* Premium Header with gradient */}
      <header className="sticky top-0 z-40 glass-premium border-b border-primary/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold gold-gradient">{t('profile.title')}</h1>
          </div>
          <Button variant="ghost" size="sm" className="h-9 hover:bg-primary/10" onClick={() => setShowEditDialog(true)}>
            <Settings className="w-4 h-4 text-primary" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* ═══════════════════════════════════════════ */}
        {/* ★ PREMIUM PROFILE HERO CARD ★ */}
        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl"
        >
          {/* Background decorative gradient */}
          <div className={cn(
            "absolute inset-0",
            isAdmin 
              ? "bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"
              : isVip 
                ? "bg-gradient-to-br from-vip/20 via-vip/5 to-transparent" 
                : "bg-gradient-to-br from-primary/10 via-transparent to-muted/30"
          )} />
          <div className="absolute top-0 end-0 w-32 h-32 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 start-0 w-24 h-24 rounded-full bg-vip/5 blur-2xl" />
          
          <div className="relative glass-premium rounded-2xl p-6">
            {/* Top section: Avatar + Name */}
            <div className="flex flex-col items-center text-center gap-4">
              {/* Avatar with glow ring */}
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadAvatar(file);
                  e.target.value = '';
                }}
              />
              <div className="relative">
                <div className={cn(
                  "absolute -inset-1 rounded-full opacity-60 blur-sm",
                  isAdmin ? "bg-gradient-to-r from-primary to-accent" 
                    : isVip ? "bg-gradient-to-r from-vip to-amber-400"
                    : "bg-gradient-to-r from-primary/40 to-primary/20"
                )} />
                <button
                  onClick={() => profile?.avatar_url ? setShowAvatarPreview(true) : avatarInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="relative group"
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt="Avatar"
                      className={cn(
                        "w-24 h-24 rounded-full object-cover border-3",
                        isAdmin ? "border-primary" : isVip ? "border-vip" : "border-primary/30"
                      )}
                    />
                  ) : (
                    <div className={cn(
                      "w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-3",
                      isAdmin ? "bg-primary/20 text-primary border-primary" :
                      isVip ? "bg-vip/20 text-vip border-vip" : "bg-primary/20 text-primary border-primary/30"
                    )}>
                      {initials}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                    ) : profile?.avatar_url ? (
                      <ZoomIn className="w-6 h-6 text-foreground" />
                    ) : (
                      <Camera className="w-6 h-6 text-foreground" />
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-background/60 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="w-6 h-6 text-foreground animate-spin" />
                    </div>
                  )}
                </button>
              </div>

              {/* Name + Role badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {displayName}
                  </h2>
                  <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/10" onClick={() => setShowEditDialog(true)}>
                    <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {isAdmin && (
                    <Badge className="bg-primary/15 text-primary border border-primary/30 gap-1 px-3 py-1">
                      <Shield className="w-3 h-3" />
                      Admin
                    </Badge>
                  )}
                  {isModerator && !isAdmin && (
                    <Badge className="bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 gap-1 px-3 py-1">
                      <Shield className="w-3 h-3" />
                      {isRTL ? 'مشرف' : 'Moderator'}
                    </Badge>
                  )}
                  {isSupport && !isAdmin && !isModerator && (
                    <Badge className="bg-cyan-500/15 text-cyan-500 border border-cyan-500/30 gap-1 px-3 py-1">
                      <Headset className="w-3 h-3" />
                      {isRTL ? 'دعم فني' : 'Support'}
                    </Badge>
                  )}
                  {isVip && !isAdmin && !isModerator && !isSupport && (
                    <Badge className="bg-vip/15 text-vip border border-vip/30 gap-1 px-3 py-1 vip-glow">
                      <Crown className="w-3 h-3" />
                      VIP
                    </Badge>
                  )}
                  {profile?.country && (
                    <Badge variant="outline" className="text-muted-foreground border-border/50 px-3 py-1">
                      {countries.find(c => c.code === profile.country)?.name[i18n.language === 'ar' ? 'ar' : 'en'] || profile.country}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* VIP Upgrade CTA */}
            {!isVip && !isAdmin && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-5"
              >
                <Button 
                  onClick={() => navigate('/vip')}
                  className="w-full bg-gradient-to-r from-vip to-amber-500 text-vip-foreground gap-2 h-11 rounded-xl shadow-lg hover:shadow-vip/20 transition-shadow"
                >
                  <Crown className="w-4 h-4" />
                  {t('profile.upgradeToVip')}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════ */}
        {/* ★ QUICK ACTIONS (Admin/Moderator/Support) ★ */}
        {/* ═══════════════════════════════════════════ */}
        {(isAdmin || isModerator || isSupport || isSupportAgent) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-2 gap-3"
          >
            {(isAdmin || isModerator) && (
              <button
                onClick={() => navigate('/admin')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl glass-card hover-glow transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {isModerator && !isAdmin ? (isRTL ? 'لوحة المشرف' : 'Moderator Panel') : t('admin.title')}
                </span>
              </button>
            )}
            {(isAdmin || isSupport || isSupportAgent) && (
              <button
                onClick={() => navigate('/support-dashboard')}
                className="flex flex-col items-center gap-2 p-4 rounded-xl glass-card hover-glow transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                  <Headset className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-foreground">{isRTL ? 'لوحة الدعم' : 'Support Panel'}</span>
              </button>
            )}
          </motion.div>
        )}

        {/* Support Button for users */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <button onClick={() => navigate('/support')}
              className="w-full flex items-center justify-between p-4 rounded-xl glass-card hover-glow transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Headset className="w-4 h-4 text-primary" />
                </div>
                <span className="font-medium text-foreground">الدعم الفني</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </button>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ★ REFERRAL LINK ★ */}
        {/* ═══════════════════════════════════════════ */}
        {user && referralCode && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.11 }}
            className="p-4 rounded-2xl glass-card border border-primary/20 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Link2 className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">{isRTL ? 'رابط الإحالة' : 'Referral Link'}</h3>
                <p className="text-[10px] text-muted-foreground">{isRTL ? 'شارك الرابط واكسب 50 نقطة لكل صديق' : 'Share & earn 50 pts per friend'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate dir-ltr" dir="ltr">
                {referralLink}
              </div>
              <Button variant="outline" size="sm" onClick={copyReferralLink} className="gap-1.5 h-9 shrink-0">
                {refCopied ? <CheckIcon2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                {refCopied ? (isRTL ? 'تم' : 'Copied') : (isRTL ? 'نسخ' : 'Copy')}
              </Button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="rounded-2xl overflow-hidden glass-card divide-y divide-border/20"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium text-foreground">{t(item.label)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && (
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  )}
                  {item.count !== undefined && (
                    <Badge variant="secondary" className="text-xs">
                      <span className="trading-number">{item.count}</span>
                    </Badge>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                </div>
              </button>
            );
          })}
        </motion.div>

        {/* Friends Section */}
        <FriendsSection />

        {/* User Posts Section */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <UserPostsSection userId={user.id} isOwnProfile={true} />
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* ★ BLOCKED USERS SECTION ★ */}
        {/* ═══════════════════════════════════════════ */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <button
              onClick={() => setShowBlockedUsers(!showBlockedUsers)}
              className="w-full flex items-center justify-between p-4 rounded-2xl glass-card hover-glow transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center">
                  <UserX className="w-4 h-4 text-destructive" />
                </div>
                <span className="font-medium text-foreground">{t('social.blockedUsers')}</span>
                {blockedUsers.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{blockedUsers.length}</Badge>
                )}
              </div>
              {showBlockedUsers ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {showBlockedUsers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-2 space-y-2">
                    {blockedUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                          <ShieldAlert className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('social.noBlockedUsers')}</p>
                      </div>
                    ) : (
                      blockedUsers.map((blocked, idx) => (
                        <motion.div
                          key={blocked.id}
                          initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center justify-between p-3 rounded-xl glass-card"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 border border-border/50">
                              <AvatarImage src={blocked.profile?.avatar_url || undefined} />
                              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                                {(blocked.profile?.display_name || blocked.profile?.username || '?').charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground text-sm">
                              {blocked.profile?.display_name || blocked.profile?.username || t('community.anonymous')}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unblockUser(blocked.blocked_id)}
                            disabled={blockLoading}
                            className="text-primary hover:bg-primary/10 gap-1 text-xs h-8"
                          >
                            <Ban className="w-3 h-3" />
                            {t('social.unblockUser')}
                          </Button>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button 
            variant="outline" 
            className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 gap-2 rounded-xl h-11"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t('profile.logout')}
          </Button>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground/60 px-4 pb-4">
          {t('disclaimer.text')}
        </p>
      </div>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>{t('profile.language')}</DialogTitle>
            <DialogDescription className="sr-only">Select language</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <button
              onClick={() => changeLanguage('ar')}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                i18n.language === 'ar' 
                  ? "bg-primary/10 border-primary/30" 
                  : "border-border/30 hover:bg-muted"
              )}
            >
              <span className="font-medium">العربية</span>
              {i18n.language === 'ar' && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button
              onClick={() => changeLanguage('en')}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-colors",
                i18n.language === 'en' 
                  ? "bg-primary/10 border-primary/30" 
                  : "border-border/30 hover:bg-muted"
              )}
            >
              <span className="font-medium">English</span>
              {i18n.language === 'en' && <Check className="w-4 h-4 text-primary" />}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('profile.editProfile')}</DialogTitle>
            <DialogDescription className="sr-only">Edit your profile information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.displayName')}</label>
              <Input
                value={editData.display_name}
                onChange={(e) => setEditData(prev => ({ ...prev, display_name: e.target.value }))}
                placeholder={t('auth.displayNamePlaceholder')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.firstName')}</label>
                <Input
                  value={editData.first_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('auth.lastName')}</label>
                <Input
                  value={editData.last_name}
                  onChange={(e) => setEditData(prev => ({ ...prev, last_name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.country')}</label>
              <Select
                value={editData.country}
                onValueChange={(value) => setEditData(prev => ({ ...prev, country: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('auth.selectCountry')} />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(country => (
                    <SelectItem key={country.code} value={country.code}>
                      {i18n.language === 'ar' ? country.name.ar : country.name.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('auth.phone')}</label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder={t('auth.phonePlaceholder')}
                dir="ltr"
              />
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Watchlist Dialog */}
      <Dialog open={showWatchlistDialog} onOpenChange={setShowWatchlistDialog}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader>
            <DialogTitle>{t('profile.watchlist')}</DialogTitle>
            <DialogDescription className="sr-only">Your watchlist</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            {watchlist.length > 0 ? (
              watchlist.map(symbol => (
                <div key={symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="font-medium">{symbol}</span>
                  <Star className="w-4 h-4 text-primary fill-primary" />
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {t('markets.noWatchlist')}
              </p>
            )}
            <Button 
              variant="outline" 
              className="w-full mt-2"
              onClick={() => { setShowWatchlistDialog(false); navigate('/markets'); }}
            >
              {t('markets.addToWatchlist')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Settings Dialog */}
      <Dialog open={showNotificationSettings} onOpenChange={setShowNotificationSettings}>
        <DialogContent className="sm:max-w-[400px]">
          <NotificationSettings />
        </DialogContent>
      </Dialog>

      {/* Premium Avatar Preview */}
      <PremiumImageViewer
        src={profile?.avatar_url || null}
        open={showAvatarPreview}
        onClose={() => setShowAvatarPreview(false)}
        glowColor={isAdmin ? 'hsl(var(--primary))' : isVip ? 'hsl(45, 100%, 50%)' : 'hsl(var(--primary))'}
        actions={
          <>
            <button
              onClick={() => {
                setShowAvatarPreview(false);
                avatarInputRef.current?.click();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
            >
              <Camera className="w-4 h-4" />
              {profile?.avatar_url ? 'تغيير' : 'رفع صورة'}
            </button>
            {profile?.avatar_url && (
              <button
                onClick={async () => {
                  await deleteAvatar();
                  setShowAvatarPreview(false);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                حذف
              </button>
            )}
          </>
        }
      />
    </AppLayout>
  );
};

export default ProfilePage;
