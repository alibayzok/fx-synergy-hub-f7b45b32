import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, DollarSign, Phone, CreditCard, TrendingUp, TrendingDown, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useUsdtListings, UsdtListing, CreateUsdtListingData } from '@/hooks/useUsdtListings';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface UsdtRoomPanelProps {
  onBack: () => void;
}

const PAYMENT_METHODS = [
  { id: 'bank_transfer', label_ar: 'تحويل بنكي', label_en: 'Bank Transfer' },
  { id: 'omt', label_ar: 'OMT', label_en: 'OMT' },
  { id: 'whish', label_ar: 'Whish', label_en: 'Whish' },
  { id: 'cash', label_ar: 'كاش', label_en: 'Cash' },
  { id: 'binance_p2p', label_ar: 'Binance P2P', label_en: 'Binance P2P' },
  { id: 'usdt_trc20', label_ar: 'USDT TRC20', label_en: 'USDT TRC20' },
];

export const UsdtRoomPanel = ({ onBack }: UsdtRoomPanelProps) => {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const { listings, loading, createListing, updateListing, deleteListing } = useUsdtListings();
  const isArabic = i18n.language === 'ar';

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<CreateUsdtListingData>({
    listing_type: 'sell',
    price: 0,
    commission: 0,
    payment_methods: [],
    contact_info: '',
    notes: '',
  });

  const formatTime = (dateStr: string) => {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: isArabic ? ar : enUS,
    });
  };

  const handlePaymentMethodToggle = (methodId: string) => {
    setFormData(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(methodId)
        ? prev.payment_methods.filter(m => m !== methodId)
        : [...prev.payment_methods, methodId],
    }));
  };

  const handleSubmit = async () => {
    if (!formData.price || !formData.contact_info || formData.payment_methods.length === 0) {
      return;
    }

    await createListing(formData);
    setFormData({
      listing_type: 'sell',
      price: 0,
      commission: 0,
      payment_methods: [],
      contact_info: '',
      notes: '',
    });
    setShowCreateDialog(false);
  };

  const getPaymentMethodLabel = (methodId: string) => {
    const method = PAYMENT_METHODS.find(m => m.id === methodId);
    return method ? (isArabic ? method.label_ar : method.label_en) : methodId;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className={cn("w-5 h-5", isArabic && "rotate-180")} />
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">
              {isArabic ? 'تبادل USDT' : 'USDT Exchange'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isArabic ? 'إعلانات البيع والشراء' : 'Buy & Sell Listings'}
            </p>
          </div>
          {isAdmin && (
            <Button size="sm" className="gap-2" onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" />
              {isArabic ? 'إعلان جديد' : 'New Listing'}
            </Button>
          )}
        </div>
      </header>

      {/* Listings */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : listings.length > 0 ? (
          listings.map((listing, index) => (
            <UsdtListingCard
              key={listing.id}
              listing={listing}
              index={index}
              isArabic={isArabic}
              isAdmin={isAdmin}
              formatTime={formatTime}
              getPaymentMethodLabel={getPaymentMethodLabel}
              onToggleActive={() => updateListing(listing.id, { is_active: !listing.is_active })}
              onDelete={() => deleteListing(listing.id)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {isArabic ? 'لا توجد إعلانات حالياً' : 'No listings available'}
            </p>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isArabic ? 'إعلان USDT جديد' : 'New USDT Listing'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>{isArabic ? 'نوع الإعلان' : 'Listing Type'}</Label>
              <Select
                value={formData.listing_type}
                onValueChange={(value: 'buy' | 'sell') =>
                  setFormData(prev => ({ ...prev, listing_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sell">{isArabic ? 'بيع USDT' : 'Sell USDT'}</SelectItem>
                  <SelectItem value="buy">{isArabic ? 'شراء USDT' : 'Buy USDT'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Price & Commission */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? 'السعر (للـ 1 USDT)' : 'Price (per 1 USDT)'}</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price || ''}
                  onChange={e => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  placeholder="89500"
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? 'العمولة %' : 'Commission %'}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.commission || ''}
                  onChange={e => setFormData(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                  placeholder="1.5"
                />
              </div>
            </div>

            {/* Min/Max Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{isArabic ? 'الحد الأدنى (اختياري)' : 'Min Amount (optional)'}</Label>
                <Input
                  type="number"
                  value={formData.min_amount || ''}
                  onChange={e => setFormData(prev => ({ ...prev, min_amount: parseFloat(e.target.value) || undefined }))}
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label>{isArabic ? 'الحد الأقصى (اختياري)' : 'Max Amount (optional)'}</Label>
                <Input
                  type="number"
                  value={formData.max_amount || ''}
                  onChange={e => setFormData(prev => ({ ...prev, max_amount: parseFloat(e.target.value) || undefined }))}
                  placeholder="10000"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-2">
              <Label>{isArabic ? 'طرق الدفع المقبولة' : 'Accepted Payment Methods'}</Label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(method => (
                  <div key={method.id} className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Checkbox
                      id={method.id}
                      checked={formData.payment_methods.includes(method.id)}
                      onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                    />
                    <Label htmlFor={method.id} className="text-sm cursor-pointer">
                      {isArabic ? method.label_ar : method.label_en}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2">
              <Label>{isArabic ? 'معلومات التواصل' : 'Contact Info'}</Label>
              <Input
                value={formData.contact_info}
                onChange={e => setFormData(prev => ({ ...prev, contact_info: e.target.value }))}
                placeholder={isArabic ? 'واتساب: +961 XX XXX XXX' : 'WhatsApp: +961 XX XXX XXX'}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{isArabic ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={isArabic ? 'أي ملاحظات إضافية...' : 'Any additional notes...'}
                rows={2}
              />
            </div>

            <Button onClick={handleSubmit} className="w-full">
              {isArabic ? 'نشر الإعلان' : 'Publish Listing'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Listing Card Component
interface UsdtListingCardProps {
  listing: UsdtListing;
  index: number;
  isArabic: boolean;
  isAdmin: boolean;
  formatTime: (date: string) => string;
  getPaymentMethodLabel: (id: string) => string;
  onToggleActive: () => void;
  onDelete: () => void;
}

const UsdtListingCard = ({
  listing,
  index,
  isArabic,
  isAdmin,
  formatTime,
  getPaymentMethodLabel,
  onToggleActive,
  onDelete,
}: UsdtListingCardProps) => {
  const isBuy = listing.listing_type === 'buy';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        listing.is_active
          ? isBuy
            ? "bg-gradient-to-br from-profit/10 to-transparent border-profit/30"
            : "bg-gradient-to-br from-loss/10 to-transparent border-loss/30"
          : "bg-muted/30 border-border/30 opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-2 rounded-lg",
            isBuy ? "bg-profit/20" : "bg-loss/20"
          )}>
            {isBuy ? (
              <TrendingUp className="w-4 h-4 text-profit" />
            ) : (
              <TrendingDown className="w-4 h-4 text-loss" />
            )}
          </div>
          <div>
            <Badge variant="outline" className={cn(
              "text-xs",
              isBuy ? "border-profit/30 text-profit" : "border-loss/30 text-loss"
            )}>
              {isBuy ? (isArabic ? 'شراء' : 'BUY') : (isArabic ? 'بيع' : 'SELL')}
            </Badge>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">{formatTime(listing.created_at)}</span>
      </div>

      {/* Price & Commission */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            {isArabic ? 'السعر / 1 USDT' : 'Price / 1 USDT'}
          </p>
          <p className="text-lg font-bold text-foreground trading-number">
            {listing.price.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">
            {isArabic ? 'العمولة' : 'Commission'}
          </p>
          <p className="text-lg font-bold text-foreground trading-number">
            {listing.commission}%
          </p>
        </div>
      </div>

      {/* Amount Range */}
      {(listing.min_amount || listing.max_amount) && (
        <div className="flex items-center gap-2 mb-3 text-sm">
          <CreditCard className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {isArabic ? 'المبلغ:' : 'Amount:'}
          </span>
          <span className="text-foreground trading-number">
            {listing.min_amount?.toLocaleString() || '0'} - {listing.max_amount?.toLocaleString() || '∞'} USDT
          </span>
        </div>
      )}

      {/* Payment Methods */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {listing.payment_methods.map(method => (
          <Badge key={method} variant="secondary" className="text-[10px]">
            {getPaymentMethodLabel(method)}
          </Badge>
        ))}
      </div>

      {/* Contact */}
      <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
        <Phone className="w-4 h-4 text-primary" />
        <span className="text-sm text-foreground">{listing.contact_info}</span>
      </div>

      {/* Notes */}
      {listing.notes && (
        <p className="mt-2 text-xs text-muted-foreground">{listing.notes}</p>
      )}

      {/* Admin Actions */}
      {isAdmin && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={onToggleActive}
          >
            {listing.is_active ? (
              <>
                <ToggleRight className="w-4 h-4 text-profit" />
                {isArabic ? 'نشط' : 'Active'}
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                {isArabic ? 'معطل' : 'Inactive'}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-loss hover:text-loss"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
            {isArabic ? 'حذف' : 'Delete'}
          </Button>
        </div>
      )}
    </motion.div>
  );
};
