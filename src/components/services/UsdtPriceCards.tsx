import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsdtPriceCardsProps {
  buyPrice: number | null;
  sellPrice: number | null;
  selectedType: 'buy' | 'sell';
  onSelectType: (type: 'buy' | 'sell') => void;
}

export const UsdtPriceCards = ({ 
  buyPrice, 
  sellPrice, 
  selectedType, 
  onSelectType 
}: UsdtPriceCardsProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const formatPrice = (price: number | null) => {
    if (price === null) return '---';
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Buy Card */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectType('buy')}
        className={cn(
          "relative overflow-hidden p-4 rounded-xl text-start transition-all",
          "border-2",
          selectedType === 'buy'
            ? "bg-gradient-to-br from-profit/20 to-profit/5 border-profit/50 shadow-lg shadow-profit/20"
            : "bg-card/50 border-border/50 hover:border-profit/30"
        )}
      >
        {/* Background Glow */}
        {selectedType === 'buy' && (
          <div className="absolute top-0 end-0 w-20 h-20 bg-profit/20 rounded-full blur-2xl" />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              selectedType === 'buy' ? "bg-profit/30" : "bg-profit/20"
            )}>
              <TrendingUp className="w-4 h-4 text-profit" />
            </div>
            <span className="text-sm font-medium text-profit">
              {t('services.usdtSection.buy')}
            </span>
          </div>
          
          <div className="mb-1">
            <span className="text-2xl font-bold text-foreground trading-number">
              {formatPrice(buyPrice)}
            </span>
            {buyPrice && (
              <span className="text-xs text-muted-foreground ms-1">
                {t('services.usdtSection.currency')}
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('services.usdtSection.buyDesc')}
          </p>
        </div>
      </motion.button>

      {/* Sell Card */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectType('sell')}
        className={cn(
          "relative overflow-hidden p-4 rounded-xl text-start transition-all",
          "border-2",
          selectedType === 'sell'
            ? "bg-gradient-to-br from-loss/20 to-loss/5 border-loss/50 shadow-lg shadow-loss/20"
            : "bg-card/50 border-border/50 hover:border-loss/30"
        )}
      >
        {/* Background Glow */}
        {selectedType === 'sell' && (
          <div className="absolute top-0 end-0 w-20 h-20 bg-loss/20 rounded-full blur-2xl" />
        )}
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              selectedType === 'sell' ? "bg-loss/30" : "bg-loss/20"
            )}>
              <TrendingDown className="w-4 h-4 text-loss" />
            </div>
            <span className="text-sm font-medium text-loss">
              {t('services.usdtSection.sell')}
            </span>
          </div>
          
          <div className="mb-1">
            <span className="text-2xl font-bold text-foreground trading-number">
              {formatPrice(sellPrice)}
            </span>
            {sellPrice && (
              <span className="text-xs text-muted-foreground ms-1">
                {t('services.usdtSection.currency')}
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground">
            {t('services.usdtSection.sellDesc')}
          </p>
        </div>
      </motion.button>
    </div>
  );
};
