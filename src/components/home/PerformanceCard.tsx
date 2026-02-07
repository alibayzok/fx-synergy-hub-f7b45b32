import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PerformanceCardProps {
  winRate: number;
  totalTrades: number;
  profitTrades: number;
  lossTrades: number;
  totalPips: number;
}

export const PerformanceCard = ({ 
  winRate, 
  totalTrades, 
  profitTrades, 
  lossTrades,
  totalPips 
}: PerformanceCardProps) => {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 rounded-xl bg-gradient-to-br from-card to-secondary/30 border border-border/50"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">{t('home.todayPerformance')}</h3>
        <div className="flex items-center gap-1 text-primary">
          <Percent className="w-4 h-4" />
          <span className="trading-number font-bold text-lg">{winRate}%</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="text-center p-2 rounded-lg bg-muted/30">
          <Target className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
          <p className="trading-number font-bold text-foreground">{totalTrades}</p>
          <p className="text-[10px] text-muted-foreground">{t('performance.totalTrades')}</p>
        </div>
        
        <div className="text-center p-2 rounded-lg bg-profit/10">
          <TrendingUp className="w-4 h-4 mx-auto mb-1 text-profit" />
          <p className="trading-number font-bold text-profit">{profitTrades}</p>
          <p className="text-[10px] text-muted-foreground">{t('performance.profit')}</p>
        </div>
        
        <div className="text-center p-2 rounded-lg bg-loss/10">
          <TrendingDown className="w-4 h-4 mx-auto mb-1 text-loss" />
          <p className="trading-number font-bold text-loss">{lossTrades}</p>
          <p className="text-[10px] text-muted-foreground">{t('performance.loss')}</p>
        </div>
        
        <div className="text-center p-2 rounded-lg bg-primary/10">
          <span className="block text-xs mb-1 text-primary">PIPS</span>
          <p className={cn(
            "trading-number font-bold",
            totalPips >= 0 ? "text-profit" : "text-loss"
          )}>
            {totalPips >= 0 ? '+' : ''}{totalPips}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
