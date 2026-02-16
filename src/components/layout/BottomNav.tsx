import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Radio, Users, Newspaper, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/useAppSettings';

const allNavItems = [
  { key: 'home', path: '/', icon: Home, settingKey: null },
  { key: 'signals', path: '/trades', icon: Radio, settingKey: 'enable_trades_page' },
  { key: 'community', path: '/community', icon: Users, settingKey: 'enable_community' },
  { key: 'news', path: '/news', icon: Newspaper, settingKey: 'enable_news_page' },
  { key: 'services', path: '/services', icon: Briefcase, settingKey: 'enable_services_page' },
];

export const BottomNav = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { getBoolean } = useAppSettings();

  const navItems = allNavItems.filter(item => {
    if (!item.settingKey) return true;
    return getBoolean(item.settingKey, true);
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border/50 pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full relative transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon className={cn("w-5 h-5", isActive && "drop-shadow-[0_0_8px_hsl(var(--primary))]")} />
              <span className="text-[10px] font-medium">{t(`nav.${item.key}`)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
