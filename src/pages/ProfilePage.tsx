import { useState } from 'react';
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
  Shield
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isAdmin, isVip, signOut, loading } = useAuth();
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const isRTL = i18n.language === 'ar';

  const changeLanguage = (lng: 'ar' | 'en') => {
    i18n.changeLanguage(lng);
    setShowLanguageDialog(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const menuItems = [
    { icon: Globe, label: 'profile.language', onClick: () => setShowLanguageDialog(true), value: i18n.language === 'ar' ? 'العربية' : 'English' },
    { icon: Bell, label: 'profile.notifications', onClick: () => {} },
    { icon: Star, label: 'profile.watchlist', onClick: () => {}, count: 0 },
    { icon: TrendingUp, label: 'profile.followedTrades', onClick: () => {}, count: 0 },
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
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('profile.title')}</h1>
          <Button variant="ghost" size="sm" className="h-9">
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
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
              isAdmin ? "bg-primary/20 text-primary" :
              isVip ? "bg-vip/20 text-vip" : "bg-primary/20 text-primary"
            )}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {user?.user_metadata?.display_name || user?.email?.split('@')[0]}
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
            </div>
          </div>

          {!isVip && !isAdmin && (
            <Button className="w-full mt-4 bg-gradient-to-r from-vip to-amber-500 text-vip-foreground gap-2">
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

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
    </AppLayout>
  );
};

export default ProfilePage;
