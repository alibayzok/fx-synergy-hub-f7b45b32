import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Bot, Radio, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppSettings } from '@/hooks/useAppSettings';

const actions = [
  { key: 'aiAssistant', icon: Bot, gradient: 'from-blue-500 to-cyan-500', settingKey: 'enable_ai_chat' },
  { key: 'viewAnalyses', icon: BarChart3, gradient: 'from-purple-500 to-pink-500', settingKey: 'enable_analyses' },
  { key: 'viewSignals', icon: Radio, gradient: 'from-emerald-500 to-teal-500', adminOnly: true, settingKey: null },
];

interface QuickActionsProps {
  isAdmin?: boolean;
  onAction?: (action: string) => void;
}

export const QuickActions = ({ isAdmin = false, onAction }: QuickActionsProps) => {
  const { t } = useTranslation();
  const { getBoolean } = useAppSettings();

  const visibleActions = actions.filter(a => {
    if (a.adminOnly && !isAdmin) return false;
    if (a.settingKey && !getBoolean(a.settingKey, true)) return false;
    return true;
  });

  return (
    <div className="grid grid-cols-3 gap-3">
      {visibleActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <motion.button
            key={action.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onAction?.(action.key)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
              "bg-gradient-to-br opacity-90 hover:opacity-100 transition-opacity",
              action.gradient
            )}
          >
            <Icon className="w-6 h-6 text-white" />
            <span className="text-xs font-medium text-white text-center">
              {t(`home.${action.key}`)}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
