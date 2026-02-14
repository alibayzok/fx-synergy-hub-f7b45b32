import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ShieldAlert
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
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
const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAdmin, isVip, signOut, loading } = useAuth();
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
  
  const [editData, setEditData] = useState({
    display_name: '',
    first_name: '',
    last_name: '',
    country: '',
    phone: ''
  });

  const isRTL = i18n.language === 'ar';

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

  return (
    <AppLayout showNotifications={false}>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
          <Button variant="ghost" size="sm" className="h-9" onClick={() => setShowEditDialog(true)}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <div className="px-4 py-4 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-5 rounded-xl border",
            isAdmin 
              ? "bg-gradient-to-br from-primary/10 to-transparent border-primary/30"
              : isVip 
                ? "bg-gradient-to-br from-vip/10 to-transparent border-vip/30" 
                : "bg-card border-border/30"
          )}
        >
          <div className="flex items-center gap-4">
            {/* Avatar with upload */}
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
                      "w-16 h-16 rounded-full object-cover border-2",
                      isAdmin ? "border-primary" : isVip ? "border-vip" : "border-border"
                    )}
                  />
                ) : (
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
                    isAdmin ? "bg-primary/20 text-primary" :
                    isVip ? "bg-vip/20 text-vip" : "bg-primary/20 text-primary"
                  )}>
                    {profile?.display_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  ) : profile?.avatar_url ? (
                    <ZoomIn className="w-5 h-5 text-white" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-white animate-spin" />
                  </div>
                )}
              </button>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0]}
                </h2>
                {isAdmin && (
                  <Badge className="bg-primary text-primary-foreground gap-1">
                    <Shield className="w-3 h-3" />
                    Admin
                  </Badge>
                )}
                {isVip && !isAdmin && (
                  <Badge className="bg-vip text-vip-foreground gap-1">
                    <Crown className="w-3 h-3" />
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.country && (
                <p className="text-xs text-muted-foreground mt-1">
                  {countries.find(c => c.code === profile.country)?.name[i18n.language === 'ar' ? 'ar' : 'en'] || profile.country}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)}>
              <Edit className="w-4 h-4" />
            </Button>
          </div>

          {!isVip && !isAdmin && (
            <Button 
              onClick={() => navigate('/vip')}
              className="w-full mt-4 bg-gradient-to-r from-vip to-amber-500 text-vip-foreground gap-2"
            >
              <Crown className="w-4 h-4" />
              {t('profile.upgradeToVip')}
            </Button>
          )}
        </motion.div>

        {/* Admin Link */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <button
              onClick={() => navigate('/admin')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">{t('admin.title')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-primary rtl:rotate-180" />
            </button>
          </motion.div>
        )}

        {/* Support Dashboard for admins and support agents */}
        {(isAdmin || isSupportAgent) && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.055 }}>
            <button onClick={() => navigate('/support-dashboard')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-3">
                <Headset className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">لوحة الدعم الفني</span>
              </div>
              <ChevronRight className="w-4 h-4 text-primary rtl:rotate-180" />
            </button>
          </motion.div>
        )}

        {/* Support Button for users */}
        {user && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <button onClick={() => navigate('/support')}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card/80 transition-colors">
              <div className="flex items-center gap-3">
                <Headset className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">الدعم الفني</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
            </button>
          </motion.div>
        )}

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-2"
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-card/50 border border-border/30 hover:bg-card transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                  <span className="font-medium text-foreground">{t(item.label)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {item.value && (
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  )}
                  {item.count !== undefined && (
                    <span className="trading-number text-sm text-muted-foreground">{item.count}</span>
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

        {/* Blocked Users Section */}
        {user && blockedUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-destructive" />
              {t('social.blockedUsers')} ({blockedUsers.length})
            </h3>
            <div className="space-y-2">
              {blockedUsers.map(blocked => (
                <div
                  key={blocked.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-card/50 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={blocked.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-muted text-muted-foreground">
                        {(blocked.profile?.display_name || blocked.profile?.username || '?').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground text-sm">
                      {blocked.profile?.display_name || blocked.profile?.username || t('community.anonymous')}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockUser(blocked.blocked_id)}
                    disabled={blockLoading}
                    className="text-primary border-primary/30 hover:bg-primary/10 gap-1 text-xs"
                  >
                    <Ban className="w-3 h-3" />
                    {t('social.unblockUser')}
                  </Button>
                </div>
              ))}
            </div>
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
            className="w-full border-loss/30 text-loss hover:bg-loss/10 gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {t('profile.logout')}
          </Button>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-muted-foreground px-4">
          {t('disclaimer.text')}
        </p>
      </div>

      {/* Language Dialog */}
      <Dialog open={showLanguageDialog} onOpenChange={setShowLanguageDialog}>
        <DialogContent className="sm:max-w-[300px]">
          <DialogHeader>
            <DialogTitle>{t('profile.language')}</DialogTitle>
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

      {/* Avatar Preview Dialog */}
      <Dialog open={showAvatarPreview} onOpenChange={setShowAvatarPreview}>
        <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>الصورة الشخصية</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 p-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar preview"
                className="w-64 h-64 rounded-xl object-cover border border-border"
              />
            ) : (
              <div className="w-64 h-64 rounded-xl bg-muted flex items-center justify-center text-6xl font-bold text-muted-foreground">
                {profile?.display_name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => {
                  setShowAvatarPreview(false);
                  avatarInputRef.current?.click();
                }}
              >
                <Camera className="w-4 h-4" />
                {profile?.avatar_url ? 'تغيير الصورة' : 'رفع صورة'}
              </Button>
              {profile?.avatar_url && (
                <Button
                  variant="outline"
                  className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10"
                  onClick={async () => {
                    await deleteAvatar();
                    setShowAvatarPreview(false);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  حذف
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ProfilePage;
