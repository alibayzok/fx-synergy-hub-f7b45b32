import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Star, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MarketSymbol } from '@/types';
import { Button } from '@/components/ui/button';

interface MarketCardProps {
  symbol: MarketSymbol;
  isWatchlisted?: boolean;
  onToggleWatchlist?: () => void;
  onCreateAlert?: () => void;
}

export const MarketCard = ({ 
  symbol, 
  isWatchlisted = false, 
  onToggleWatchlist, 
  onCreateAlert 
}: MarketCardProps) => {
  const { t } = useTranslation();
  const isPositive = symbol.change >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-3 rounded-lg bg-card/50 border border-border/30 hover:bg-card transition-colors"
    >
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleWatchlist}
          className={cn(
            "p-1.5 rounded transition-colors",
            isWatchlisted ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn("w-4 h-4", isWatchlisted && "fill-current")} />
        </button>
        
        <div>
          <h4 className="font-semibold text-foreground">{symbol.symbol}</h4>
          <p className="text-xs text-muted-foreground">{symbol.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-end">
          <p className="trading-number font-semibold text-foreground">
            {symbol.price.toLocaleString('en-US', {
              minimumFractionDigits: symbol.asset_type === 'crypto' ? 0 : 2,
              maximumFractionDigits: symbol.asset_type === 'crypto' ? 0 : symbol.asset_type === 'forex' ? 4 : 2
            })}
          </p>
          <div className={cn(
            "flex items-center gap-1 justify-end text-xs",
            isPositive ? "text-profit" : "text-loss"
          )}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="trading-number">
              {isPositive ? '+' : ''}{symbol.change_percent.toFixed(2)}%
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onCreateAlert}
          className="h-8 w-8 p-0"
        >
          <Bell className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};
