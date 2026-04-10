import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bot, Radio, BarChart3, Trophy, Calculator, Gift, Download, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/useAppSettings';
import { PipCalculatorDialog } from './PipCalculatorDialog';

const actions = [
  { key: 'searchUsers', icon: Search, gradient: 'from-indigo-500 to-blue-400', settingKey: null },
  { key: 'aiAssistant', icon: Bot, gradient: 'from-blue-500 to-cyan-400', settingKey: 'enable_ai_chat' },
  { key: 'viewAnalyses', icon: BarChart3, gradient: 'from-purple-500 to-pink-400', settingKey: 'enable_analyses' },
  { key: 'viewSignals', icon: Radio, gradient: 'from-emerald-500 to-teal-400', adminOnly: false, settingKey: null },
  { key: 'gamification', icon: Trophy, gradient: 'from-amber-500 to-yellow-400', settingKey: null },
  { key: 'rewards', icon: Gift, gradient: 'from-rose-500 to-pink-400', settingKey: null },
  { key: 'pipCalculator', icon: Calculator, gradient: 'from-orange-500 to-red-400', settingKey: null },
  { key: 'installApp', icon: Download, gradient: 'from-green-500 to-emerald-400', settingKey: 'show_install_button' },
];

interface QuickActionsProps {
  isAdmin?: boolean;
  onAction?: (action: string) => void;
}

export const QuickActions = ({ isAdmin = false, onAction }: QuickActionsProps) => {
  const { t } = useTranslation();
  const { getBoolean } = useAppSettings();
  const [calcOpen, setCalcOpen] = useState(false);

  const visibleActions = actions.filter(a => {
    if ((a as any).adminOnly && !isAdmin) return false;
    if (a.settingKey && !getBoolean(a.settingKey, true)) return false;
    return true;
  });

  const handleClick = (key: string) => {
    if (key === 'pipCalculator') {
      setCalcOpen(true);
    } else {
      onAction?.(key);
    }
  };

  return (
    <>
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.key}
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 22 }}
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleClick(action.key)}
              className="flex flex-col items-center gap-1.5 shrink-0"
            >
              <div className={cn(
                "relative w-12 h-12 rounded-2xl flex items-center justify-center",
                "bg-gradient-to-br shadow-md transition-shadow duration-300 hover:shadow-lg",
                action.gradient,
              )}>
                {/* Shine */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/25 via-transparent to-transparent pointer-events-none" />
                <div className="absolute inset-[1px] rounded-2xl border border-white/15 pointer-events-none" />
                <Icon className="w-5 h-5 text-white drop-shadow-sm relative z-10" />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight max-w-[56px] line-clamp-1">
                {t(`home.${action.key}`)}
              </span>
            </motion.button>
          );
        })}
      </div>
      <PipCalculatorDialog open={calcOpen} onOpenChange={setCalcOpen} />
    </>
  );
};
