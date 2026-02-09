import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, CreditCard, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UsdtListing } from '@/hooks/useUsdtListings';
import { cn } from '@/lib/utils';

interface UsdtListingsDisplayProps {
  listings: UsdtListing[];
  loading: boolean;
}

export const UsdtListingsDisplay = ({ listings, loading }: UsdtListingsDisplayProps) => {
  const { t } = useTranslation();

  const activeListings = listings.filter(l => l.is_active);

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">{t('services.usdtSection.availableListings')}</h3>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (activeListings.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-muted-foreground">{t('services.usdtSection.noListings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground">{t('services.usdtSection.availableListings')}</h3>
      
      {activeListings.map((listing, index) => {
        const isBuy = listing.listing_type === 'buy';
        
        return (
          <motion.div
            key={listing.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "p-4 rounded-xl border",
              isBuy 
                ? "bg-profit/5 border-profit/20" 
                : "bg-loss/5 border-loss/20"
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isBuy ? "bg-profit/20" : "bg-loss/20"
                )}>
                  {isBuy ? (
                    <TrendingUp className="w-4 h-4 text-profit" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-loss" />
                  )}
                </div>
                <div>
                  <Badge variant={isBuy ? "default" : "destructive"} className="text-xs">
                    {isBuy ? t('services.usdtSection.adminBuys') : t('services.usdtSection.adminSells')}
                  </Badge>
                </div>
              </div>
              
              <div className="text-end">
                <div className="text-lg font-bold text-foreground trading-number">
                  {listing.price.toLocaleString('en-US')}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t('services.usdtSection.currency')}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-2">
              {listing.commission > 0 && (
                <Badge variant="outline" className="text-xs">
                  {t('services.usdtSection.commission')}: {listing.commission}%
                </Badge>
              )}
              {listing.min_amount && (
                <Badge variant="outline" className="text-xs trading-number">
                  {t('services.usdtSection.min')}: ${listing.min_amount}
                </Badge>
              )}
              {listing.max_amount && (
                <Badge variant="outline" className="text-xs trading-number">
                  {t('services.usdtSection.max')}: ${listing.max_amount}
                </Badge>
              )}
            </div>

            {listing.payment_methods.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CreditCard className="w-3 h-3" />
                {listing.payment_methods.map(method => 
                  t(`services.usdtSection.paymentMethods.${method}`, method)
                ).join(' • ')}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
