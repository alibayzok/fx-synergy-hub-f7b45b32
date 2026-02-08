import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Clock, Activity, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradeStatsProps {
  stats: {
    totalTrades: number;
    runningCount: number;
    pendingCount: number;
    closedCount: number;
    profitTrades: number;
    lossTrades: number;
    winRate: number;
  };
}

export const TradeStats = ({ stats }: TradeStatsProps) => {
  const { t } = useTranslation();
  
  const statItems = [
    {
      icon: Award,
      label: t('performance.winRate'),
      value: `${stats.winRate}%`,
      color: stats.winRate >= 50 ? 'text-profit' : 'text-loss',
      bgColor: stats.winRate >= 50 ? 'bg-profit/10' : 'bg-loss/10',
      borderColor: stats.winRate >= 50 ? 'border-profit/30' : 'border-loss/30',
    },
    {
      icon: TrendingUp,
      label: t('performance.profit'),
      value: stats.profitTrades,
      color: 'text-profit',
      bgColor: 'bg-profit/10',
      borderColor: 'border-profit/30',
    },
    {
      icon: TrendingDown,
      label: t('performance.loss'),
      value: stats.lossTrades,
      color: 'text-loss',
      bgColor: 'bg-loss/10',
      borderColor: 'border-loss/30',
    },
    {
      icon: Activity,
      label: t('trades.running'),
      value: stats.runningCount,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 px-4 py-3">
      {statItems.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "relative flex flex-col items-center justify-center p-3 rounded-xl border text-center",
            item.bgColor,
            item.borderColor
          )}
        >
          <item.icon className={cn("w-5 h-5 mb-1", item.color)} />
          <span className={cn("text-lg font-bold trading-number", item.color)}>
            {item.value}
          </span>
          <span className="text-[10px] text-muted-foreground line-clamp-1">
            {item.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
};
