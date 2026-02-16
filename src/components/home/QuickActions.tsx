import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bot, Radio, BarChart3, Trophy, Calculator, Gift, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/useAppSettings';
import { PipCalculatorDialog } from './PipCalculatorDialog';

const actions = [
  { key: 'aiAssistant', icon: Bot, gradient: 'from-blue-500 to-cyan-400', glow: 'shadow-blue-500/20', settingKey: 'enable_ai_chat' },
  { key: 'viewAnalyses', icon: BarChart3, gradient: 'from-purple-500 to-pink-400', glow: 'shadow-purple-500/20', settingKey: 'enable_analyses' },
  { key: 'viewSignals', icon: Radio, gradient: 'from-emerald-500 to-teal-400', glow: 'shadow-emerald-500/20', adminOnly: false, settingKey: null },
  { key: 'gamification', icon: Trophy, gradient: 'from-amber-500 to-yellow-400', glow: 'shadow-amber-500/20', settingKey: null },
  { key: 'rewards', icon: Gift, gradient: 'from-rose-500 to-pink-400', glow: 'shadow-rose-500/20', settingKey: null },
  { key: 'pipCalculator', icon: Calculator, gradient: 'from-orange-500 to-red-400', glow: 'shadow-orange-500/20', settingKey: null },
  { key: 'installApp', icon: Download, gradient: 'from-green-500 to-emerald-400', glow: 'shadow-green-500/20', settingKey: 'show_install_button' },
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
    if (a.adminOnly && !isAdmin) return false;
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
      <div className="grid grid-cols-3 gap-3">
        {visibleActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={action.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleClick(action.key)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl overflow-hidden",
                "bg-gradient-to-br transition-shadow duration-300",
                action.gradient,
                `shadow-lg ${action.glow} hover:shadow-xl`
              )}
            >
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />
              {/* Subtle ring */}
              <div className="absolute inset-[1px] rounded-2xl border border-white/15 pointer-events-none" />

              <div className="relative z-10 w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <Icon className="w-5 h-5 text-white drop-shadow-sm" />
              </div>
              <span className="relative z-10 text-xs font-semibold text-white text-center leading-tight drop-shadow-sm">
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
