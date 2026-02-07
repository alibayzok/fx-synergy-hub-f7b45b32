import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Globe, 
  Bell, 
  Crown, 
  Star, 
  TrendingUp, 
  LogOut,
  ChevronRight,
  Check
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { currentUser, performanceStats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const isRTL = i18n.language === 'ar';

  const changeLanguage = (lng: 'ar' | 'en') => {
    i18n.changeLanguage(lng);
    setShowLanguageDialog(false);
  };

  const isVip = currentUser.role === 'vip' || currentUser.role === 'admin';

  const menuItems = [
    { icon: Globe, label: 'profile.language', onClick: () => setShowLanguageDialog(true), value: i18n.language === 'ar' ? 'العربية' : 'English' },
    { icon: Bell, label: 'profile.notifications', onClick: () => {} },
    { icon: Star, label: 'profile.watchlist', onClick: () => {}, count: currentUser.watchlist.length },
    { icon: TrendingUp, label: 'profile.followedTrades', onClick: () => {}, count: currentUser.followed_trades.length },
  ];

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
            isVip 
              ? "bg-gradient-to-br from-vip/10 to-transparent border-vip/30" 
              : "bg-card border-border/30"
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold",
              isVip ? "bg-vip/20 text-vip" : "bg-primary/20 text-primary"
            )}>
              {currentUser.display_name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  {currentUser.display_name}
                </h2>
                {isVip && (
                  <Badge className="bg-vip text-vip-foreground gap-1">
                    <Crown className="w-3 h-3" />
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{currentUser.username}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('profile.joinDate')}: {new Date(currentUser.joined_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {!isVip && (
            <Button className="w-full mt-4 bg-gradient-to-r from-vip to-amber-500 text-vip-foreground gap-2">
              <Crown className="w-4 h-4" />
              {t('profile.upgradeToVip')}
            </Button>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="p-3 rounded-lg bg-card/50 border border-border/30 text-center">
            <p className="trading-number text-xl font-bold text-primary">
              {performanceStats.winRate}%
            </p>
            <p className="text-xs text-muted-foreground">{t('performance.winRate')}</p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/30 text-center">
            <p className="trading-number text-xl font-bold text-foreground">
              {currentUser.followed_trades.length}
            </p>
            <p className="text-xs text-muted-foreground">{t('trades.following')}</p>
          </div>
          <div className="p-3 rounded-lg bg-card/50 border border-border/30 text-center">
            <p className="trading-number text-xl font-bold text-foreground">
              {currentUser.watchlist.length}
            </p>
            <p className="text-xs text-muted-foreground">{t('markets.watchlist')}</p>
          </div>
        </motion.div>

        {/* Menu Items */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
          transition={{ delay: 0.3 }}
        >
          <Button 
            variant="outline" 
            className="w-full border-loss/30 text-loss hover:bg-loss/10 gap-2"
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
