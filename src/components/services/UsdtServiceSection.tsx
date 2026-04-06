import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coins, Info, Shield, Zap, Clock } from 'lucide-react';
import { UsdtPriceCards } from './UsdtPriceCards';
import { UsdtRequestForm } from './UsdtRequestForm';
import { UsdtListingsDisplay } from './UsdtListingsDisplay';
import { useUsdtListings } from '@/hooks/useUsdtListings';

interface UsdtServiceSectionProps {
  onRequestSubmitted: () => void;
}

export const UsdtServiceSection = ({ onRequestSubmitted }: UsdtServiceSectionProps) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { listings, loading } = useUsdtListings();
  const [selectedType, setSelectedType] = useState<'buy' | 'sell'>('buy');

  const prices = useMemo(() => {
    const buyListings = listings.filter(l => l.listing_type === 'buy' && l.is_active);
    const sellListings = listings.filter(l => l.listing_type === 'sell' && l.is_active);
    
    return {
      buyPrice: sellListings.length > 0 
        ? Math.min(...sellListings.map(l => l.price)) 
        : null,
      sellPrice: buyListings.length > 0 
        ? Math.max(...buyListings.map(l => l.price)) 
        : null,
    };
  }, [listings]);

  const features = [
    { icon: Shield, label: isRTL ? 'معاملات آمنة' : 'Secure Transactions', color: 'text-emerald-400' },
    { icon: Zap, label: isRTL ? 'تنفيذ فوري' : 'Instant Execution', color: 'text-amber-400' },
    { icon: Clock, label: isRTL ? 'دعم 24/7' : '24/7 Support', color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20"
      >
        <div className="absolute top-0 end-0 w-48 h-48 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 start-0 w-32 h-32 bg-teal-500/8 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25"
            >
              <Coins className="w-7 h-7 text-white" />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {t('services.usdtSection.title')}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('services.usdtSection.subtitle')}
              </p>
            </div>
          </div>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card/60 border border-border/30 text-xs font-medium"
              >
                <feat.icon className={`w-3.5 h-3.5 ${feat.color}`} />
                <span className="text-foreground">{feat.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Price Cards */}
      <UsdtPriceCards 
        buyPrice={prices.buyPrice} 
        sellPrice={prices.sellPrice}
        selectedType={selectedType}
        onSelectType={setSelectedType}
      />

      {/* Request Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <UsdtRequestForm 
          selectedType={selectedType}
          onSuccess={onRequestSubmitted}
        />
      </motion.div>

      {/* Available Listings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <UsdtListingsDisplay listings={listings} loading={loading} />
      </motion.div>

      {/* Info Note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-muted/20 border border-border/20"
      >
        <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          {t('services.usdtSection.infoNote')}
        </p>
      </motion.div>
    </div>
  );
};
