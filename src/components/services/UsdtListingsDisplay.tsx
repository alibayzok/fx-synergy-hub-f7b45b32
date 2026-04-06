import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, CreditCard, Clock, DollarSign, ChevronDown, MessageCircle, Copy, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UsdtListing } from '@/hooks/useUsdtListings';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface UsdtListingsDisplayProps {
  listings: UsdtListing[];
  loading: boolean;
}

export const UsdtListingsDisplay = ({ listings, loading }: UsdtListingsDisplayProps) => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeListings = listings.filter(l => l.is_active);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: isRTL ? 'تم النسخ' : 'Copied!' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          {t('services.usdtSection.availableListings')}
        </h3>
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (activeListings.length === 0) {
    return (
      <div className="text-center py-10 rounded-2xl border border-dashed border-border/40 bg-card/30">
        <Clock className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{t('services.usdtSection.noListings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-foreground flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-primary" />
        {t('services.usdtSection.availableListings')}
        <Badge variant="secondary" className="text-[10px] font-normal">
          {activeListings.length}
        </Badge>
      </h3>
      
      <div className="space-y-2.5">
        {activeListings.map((listing, index) => {
          const isBuy = listing.listing_type === 'buy';
          const isExpanded = expandedId === listing.id;
          
          return (
            <motion.div
              key={listing.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, type: 'spring', stiffness: 300 }}
              className={cn(
                "rounded-2xl border transition-all cursor-pointer overflow-hidden",
                isBuy 
                  ? "bg-gradient-to-r from-profit/5 to-transparent border-profit/15" 
                  : "bg-gradient-to-r from-loss/5 to-transparent border-loss/15",
                isExpanded && (isBuy ? "border-profit/40 shadow-lg shadow-profit/10" : "border-loss/40 shadow-lg shadow-loss/10")
              )}
              onClick={() => setExpandedId(isExpanded ? null : listing.id)}
            >
              {/* Main Row */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                    isBuy ? "bg-profit/15" : "bg-loss/15"
                  )}>
                    {isBuy ? (
                      <TrendingUp className="w-5 h-5 text-profit" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-loss" />
                    )}
                  </div>
                  <div>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs font-medium border mb-0.5",
                        isBuy ? "border-profit/30 text-profit bg-profit/5" : "border-loss/30 text-loss bg-loss/5"
                      )}
                    >
                      {isBuy ? t('services.usdtSection.adminBuys') : t('services.usdtSection.adminSells')}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {listing.payment_methods.length > 0 && (
                        <>
                          <CreditCard className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">
                            {listing.payment_methods.map(method => 
                              t(`services.usdtSection.paymentMethods.${method}`, method)
                            ).join(' · ')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-end">
                    <div className="text-xl font-extrabold text-foreground trading-number">
                      {listing.price.toLocaleString('en-US')}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium">
                      {t('services.usdtSection.currency')}
                    </div>
                  </div>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </motion.div>
                </div>
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "px-4 pb-4 pt-0 space-y-3 border-t",
                      isBuy ? "border-profit/10" : "border-loss/10"
                    )}>
                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-3">
                        <DetailItem 
                          label={isRTL ? 'السعر' : 'Price'} 
                          value={`${listing.price.toLocaleString('en-US')} ${isRTL ? 'ل.ل' : 'LBP'}`}
                          highlight
                        />
                        <DetailItem 
                          label={isRTL ? 'العمولة' : 'Commission'} 
                          value={listing.commission > 0 ? `${listing.commission}%` : (isRTL ? 'بدون عمولة' : 'No commission')}
                        />
                        <DetailItem 
                          label={isRTL ? 'الحد الأدنى' : 'Min Amount'} 
                          value={listing.min_amount ? `$${listing.min_amount.toLocaleString()}` : '—'}
                        />
                        <DetailItem 
                          label={isRTL ? 'الحد الأقصى' : 'Max Amount'} 
                          value={listing.max_amount ? `$${listing.max_amount.toLocaleString()}` : '—'}
                        />
                      </div>

                      {/* Payment Methods */}
                      {listing.payment_methods.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] text-muted-foreground font-medium">
                            {isRTL ? 'طرق الدفع المتاحة' : 'Payment Methods'}
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {listing.payment_methods.map((method, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-muted/60">
                                {t(`services.usdtSection.paymentMethods.${method}`, method)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Notes */}
                      {listing.notes && (
                        <div className="p-3 rounded-xl bg-muted/30 border border-border/20">
                          <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                            {isRTL ? 'ملاحظات' : 'Notes'}
                          </span>
                          <p className="text-sm text-foreground">{listing.notes}</p>
                        </div>
                      )}

                      {/* Contact */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 h-9"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(listing.contact_info, listing.id);
                          }}
                        >
                          {copiedId === listing.id ? (
                            <Check className="w-3.5 h-3.5 text-profit" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedId === listing.id 
                            ? (isRTL ? 'تم النسخ!' : 'Copied!')
                            : (isRTL ? 'نسخ معلومات التواصل' : 'Copy Contact Info')
                          }
                        </Button>
                        {listing.contact_info.includes('+') && (
                          <Button
                            size="sm"
                            className={cn(
                              "gap-2 h-9 text-white",
                              isBuy ? "bg-profit hover:bg-profit/90" : "bg-loss hover:bg-loss/90"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://wa.me/${listing.contact_info.replace(/[^0-9]/g, '')}`, '_blank');
                            }}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            {isRTL ? 'واتساب' : 'WhatsApp'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="p-2.5 rounded-xl bg-card/60 border border-border/20">
    <span className="text-[10px] text-muted-foreground block mb-0.5">{label}</span>
    <span className={cn(
      "text-sm font-semibold trading-number",
      highlight ? "text-foreground" : "text-foreground/80"
    )}>
      {value}
    </span>
  </div>
);
