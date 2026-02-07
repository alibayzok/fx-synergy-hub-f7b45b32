import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { MarketSymbol } from '@/types';

interface MarketTickerProps {
  symbols: MarketSymbol[];
}

export const MarketTicker = ({ symbols }: MarketTickerProps) => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const TickerItem = ({ symbol }: { symbol: MarketSymbol }) => {
    const isPositive = symbol.change >= 0;
    
    return (
      <div className="flex items-center gap-3 px-4 py-2 mx-2 rounded-lg bg-card/50 border border-border/30">
        <span className="font-semibold text-sm text-foreground">{symbol.symbol}</span>
        <span className="trading-number font-medium text-foreground">
          {symbol.price.toLocaleString('en-US', { 
            minimumFractionDigits: symbol.asset_type === 'crypto' ? 0 : 2,
            maximumFractionDigits: symbol.asset_type === 'crypto' ? 0 : symbol.asset_type === 'forex' ? 4 : 2
          })}
        </span>
        <span 
          className={cn(
            "trading-number text-xs font-medium px-1.5 py-0.5 rounded",
            isPositive ? "text-profit bg-profit/10" : "text-loss bg-loss/10"
          )}
        >
          {isPositive ? '+' : ''}{symbol.change_percent.toFixed(2)}%
        </span>
      </div>
    );
  };

  // Duplicate items for seamless loop
  const duplicatedSymbols = [...symbols, ...symbols];

  return (
    <div className="overflow-hidden border-b border-border/30 py-2 bg-card/30">
      <motion.div 
        className="flex ticker-scroll"
        style={{ 
          width: 'fit-content',
          direction: 'ltr' // Always LTR for trading data
        }}
      >
        {duplicatedSymbols.map((symbol, index) => (
          <TickerItem key={`${symbol.symbol}-${index}`} symbol={symbol} />
        ))}
      </motion.div>
    </div>
  );
};
