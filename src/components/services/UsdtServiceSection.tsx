import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Coins, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { UsdtPriceCards } from './UsdtPriceCards';
import { UsdtRequestForm } from './UsdtRequestForm';
import { UsdtListingsDisplay } from './UsdtListingsDisplay';
import { useUsdtListings } from '@/hooks/useUsdtListings';

interface UsdtServiceSectionProps {
  onRequestSubmitted: () => void;
}

export const UsdtServiceSection = ({ onRequestSubmitted }: UsdtServiceSectionProps) => {
  const { t } = useTranslation();
  const { listings, loading } = useUsdtListings();
  const [selectedType, setSelectedType] = useState<'buy' | 'sell'>('buy');

  // Get best prices from listings
  const prices = useMemo(() => {
    const buyListings = listings.filter(l => l.listing_type === 'buy' && l.is_active);
    const sellListings = listings.filter(l => l.listing_type === 'sell' && l.is_active);
    
    return {
      // For users: "buy" means they buy, so we show admin's "sell" price
      buyPrice: sellListings.length > 0 
        ? Math.min(...sellListings.map(l => l.price)) 
        : null,
      // For users: "sell" means they sell, so we show admin's "buy" price
      sellPrice: buyListings.length > 0 
        ? Math.max(...buyListings.map(l => l.price)) 
        : null,
    };
  }, [listings]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/30">
          <Coins className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">
          {t('services.usdtSection.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('services.usdtSection.subtitle')}
        </p>
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex items-start gap-3 p-4 rounded-xl bg-muted/30 border border-border/30"
      >
        <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground">
          {t('services.usdtSection.infoNote')}
        </p>
      </motion.div>
    </div>
  );
};
