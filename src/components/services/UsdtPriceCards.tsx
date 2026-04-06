import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
  const { t } = useTranslation();

  const formatPrice = (price: number | null) => {
    if (price === null) return '---';
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  const cards = [
    {
      type: 'buy' as const,
      price: buyPrice,
      icon: TrendingUp,
      label: t('services.usdtSection.buy'),
      desc: t('services.usdtSection.buyDesc'),
      colorClass: 'profit',
    },
    {
      type: 'sell' as const,
      price: sellPrice,
      icon: TrendingDown,
      label: t('services.usdtSection.sell'),
      desc: t('services.usdtSection.sellDesc'),
      colorClass: 'loss',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, i) => {
        const isSelected = selectedType === card.type;
        const Icon = card.icon;
        const isBuy = card.type === 'buy';

        return (
          <motion.button
            key={card.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => onSelectType(card.type)}
            className={cn(
              "relative overflow-hidden rounded-2xl text-start transition-all duration-300",
              "border-2 p-4",
              isSelected
                ? isBuy
                  ? "bg-gradient-to-br from-profit/15 via-profit/8 to-transparent border-profit/40 shadow-xl shadow-profit/15"
                  : "bg-gradient-to-br from-loss/15 via-loss/8 to-transparent border-loss/40 shadow-xl shadow-loss/15"
                : "bg-card/60 border-border/40 hover:border-border/60"
            )}
          >
            {/* Animated glow */}
            <AnimatePresence>
              {isSelected && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className={cn(
                    "absolute -top-6 -end-6 w-24 h-24 rounded-full blur-2xl",
                    isBuy ? "bg-profit/25" : "bg-loss/25"
                  )}
                />
              )}
            </AnimatePresence>

            <div className="relative z-10 space-y-3">
              {/* Icon + Label */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: isSelected ? [0, -10, 10, 0] : 0 }}
                    transition={{ duration: 0.5 }}
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                      isSelected
                        ? isBuy ? "bg-profit/25" : "bg-loss/25"
                        : "bg-muted/60"
                    )}
                  >
                    <Icon className={cn(
                      "w-4.5 h-4.5",
                      isBuy ? "text-profit" : "text-loss"
                    )} />
                  </motion.div>
                  <span className={cn(
                    "text-sm font-bold",
                    isBuy ? "text-profit" : "text-loss"
                  )}>
                    {card.label}
                  </span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                      "w-2 h-2 rounded-full",
                      isBuy ? "bg-profit" : "bg-loss"
                    )}
                  />
                )}
              </div>

              {/* Price */}
              <div>
                <motion.span
                  key={card.price}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-2xl font-extrabold text-foreground trading-number block"
                >
                  {formatPrice(card.price)}
                </motion.span>
                {card.price && (
                  <span className="text-[11px] text-muted-foreground font-medium">
                    {t('services.usdtSection.currency')}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {card.desc}
              </p>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};
