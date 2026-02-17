import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Radio, Users, Newspaper, Briefcase, BarChart3, User, Crown, MessageSquare, Settings, HelpCircle, GraduationCap, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useAuth } from '@/hooks/useAuth';
import appLogo from '@/assets/logo-dark.png';

const allNavItems = [
  { key: 'home', path: '/', icon: Home, labelAr: 'الرئيسية', labelEn: 'Home', settingKey: null },
  { key: 'signals', path: '/trades', icon: Radio, labelAr: 'الإشارات', labelEn: 'Signals', settingKey: 'enable_trades_page' },
  { key: 'analyses', path: '/analyses', icon: BarChart3, labelAr: 'التحليلات', labelEn: 'Analyses', settingKey: 'enable_analyses_page' },
  { key: 'community', path: '/community', icon: Users, labelAr: 'المجتمع', labelEn: 'Community', settingKey: 'enable_community' },
  { key: 'news', path: '/news', icon: Newspaper, labelAr: 'الأخبار', labelEn: 'News', settingKey: 'enable_news_page' },
  { key: 'services', path: '/services', icon: Briefcase, labelAr: 'الخدمات', labelEn: 'Services', settingKey: 'enable_services_page' },
  { key: 'messages', path: '/messages', icon: MessageSquare, labelAr: 'الرسائل', labelEn: 'Messages', settingKey: null },
  { key: 'gamification', path: '/gamification', icon: Crown, labelAr: 'النقاط', labelEn: 'Points', settingKey: 'enable_gamification' },
  { key: 'vip', path: '/vip', icon: Crown, labelAr: 'VIP', labelEn: 'VIP', settingKey: null },
  { key: 'rewards', path: '/rewards', icon: Gift, labelAr: 'المكافآت', labelEn: 'Rewards', settingKey: 'enable_rewards' },
];

const bottomNavItems = [
  { key: 'support', path: '/support', icon: HelpCircle, labelAr: 'الدعم', labelEn: 'Support' },
  { key: 'profile', path: '/profile', icon: User, labelAr: 'الملف الشخصي', labelEn: 'Profile' },
];

export const WebSidebar = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { getBoolean } = useAppSettings();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const { getSetting } = useAppSettings();
  const appName = getSetting('app_name', 'ASSASSIN FX');

  const navItems = allNavItems.filter(item => {
    if (!item.settingKey) return true;
    return getBoolean(item.settingKey, true);
  });

  return (
    <aside className="fixed top-0 bottom-0 start-0 z-40 w-[240px] bg-sidebar-background border-e border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
        <img src={appLogo} alt={appName} className="h-10 w-10 rounded-full object-cover border border-primary/30 shadow-md" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold gold-gradient truncate">{appName}</h1>
          <p className="text-[11px] text-sidebar-foreground/50 truncate">
            {isRTL ? 'مجتمع التداول الاحترافي' : 'Pro Trading Community'}
          </p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const label = isRTL ? item.labelAr : item.labelEn;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/20 shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5 shrink-0", isActive && "drop-shadow-[0_0_6px_hsl(var(--sidebar-primary))]")} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          const label = isRTL ? item.labelAr : item.labelEn;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
