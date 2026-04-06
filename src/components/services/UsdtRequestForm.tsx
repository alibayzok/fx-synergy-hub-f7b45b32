import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Wallet, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useServiceRequests, ServiceType } from '@/hooks/useServiceRequests';
import { useAppSettings } from '@/hooks/useAppSettings';
import { cn } from '@/lib/utils';

interface UsdtRequestFormProps {
  selectedType: 'buy' | 'sell';
  onSuccess?: () => void;
}

const NETWORKS = [
  { value: 'TRC20', label: 'TRC20 (Tron)', recommended: true },
  { value: 'ERC20', label: 'ERC20 (Ethereum)', recommended: false },
  { value: 'BEP20', label: 'BEP20 (BSC)', recommended: false },
];

export const UsdtRequestForm = ({ selectedType, onSuccess }: UsdtRequestFormProps) => {
  const { t } = useTranslation();
  const { getSetting } = useAppSettings();
  const { createRequest } = useServiceRequests();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const paymentMethods = useMemo(() => {
    const raw = (getSetting('usdt_payment_methods', '') || '').trim();
    if (!raw) {
      return [
        { value: 'bank_transfer', label: t('services.usdtSection.paymentMethods.bank_transfer') },
        { value: 'omt', label: t('services.usdtSection.paymentMethods.omt') },
        { value: 'whish', label: t('services.usdtSection.paymentMethods.whish') },
        { value: 'cash', label: t('services.usdtSection.paymentMethods.cash') },
      ];
    }
    return raw.split(',').map((p) => p.trim()).filter(Boolean).map((pair) => {
      const [key, ...rest] = pair.split(':');
      const label = rest.join(':') || key;
      return { value: key.trim(), label: label.trim() };
    });
  }, [getSetting, t]);

  const [formData, setFormData] = useState({
    amount: '',
    network: 'TRC20',
    paymentMethod: '',
    walletAddress: '',
    notes: '',
  });

  const handleSubmit = async () => {
    if (!formData.amount || !formData.paymentMethod) return;
    if (selectedType === 'buy' && !formData.walletAddress) return;

    setSubmitting(true);
    
    const result = await createRequest({
      type: (selectedType === 'buy' ? 'usdt_buy' : 'usdt_sell') as ServiceType,
      amount: parseFloat(formData.amount),
      network: formData.network,
      payment_method: formData.paymentMethod,
      wallet_address: selectedType === 'buy' ? formData.walletAddress : undefined,
      notes: formData.notes || undefined,
    });

    setSubmitting(false);

    if (result) {
      setSubmitted(true);
      setTimeout(() => {
        setFormData({ amount: '', network: 'TRC20', paymentMethod: '', walletAddress: '', notes: '' });
        setSubmitted(false);
        onSuccess?.();
      }, 1500);
    }
  };

  const isBuy = selectedType === 'buy';
  const isValid = formData.amount && formData.paymentMethod && (!isBuy || formData.walletAddress);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        isBuy 
          ? "bg-gradient-to-br from-profit/5 via-transparent to-transparent border-profit/20" 
          : "bg-gradient-to-br from-loss/5 via-transparent to-transparent border-loss/20"
      )}
    >
      {/* Header */}
      <div className={cn(
        "px-4 py-3 border-b flex items-center gap-2.5",
        isBuy ? "border-profit/10" : "border-loss/10"
      )}>
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          isBuy ? "bg-profit/15" : "bg-loss/15"
        )}>
          <Wallet className={cn("w-4 h-4", isBuy ? "text-profit" : "text-loss")} />
        </div>
        <h3 className="font-bold text-foreground text-sm">
          {isBuy ? t('services.usdtSection.buyRequest') : t('services.usdtSection.sellRequest')}
        </h3>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <CheckCircle2 className={cn("w-16 h-16 mb-3", isBuy ? "text-profit" : "text-loss")} />
            </motion.div>
            <p className="font-bold text-foreground">{t('services.requestSubmitted')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('services.requestSubmittedDesc')}</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 space-y-4"
          >
            {/* Amount + Network row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('services.amount')} (USDT)</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="100"
                  className="trading-number h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('services.network')}</Label>
                <Select
                  value={formData.network}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NETWORKS.map((network) => (
                      <SelectItem key={network.value} value={network.value}>
                        {network.label}
                        {network.recommended && (
                          <span className="text-[10px] text-profit ms-1">✓</span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('services.usdtSection.paymentMethod')}</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={t('services.usdtSection.selectPayment')} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wallet Address (buy only) */}
            <AnimatePresence>
              {isBuy && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <Label className="text-xs font-medium">
                    {t('services.usdtSection.walletAddress')}
                    <span className="text-muted-foreground ms-1 font-normal">
                      ({formData.network})
                    </span>
                  </Label>
                  <Input
                    value={formData.walletAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                    placeholder={t('services.usdtSection.walletPlaceholder')}
                    className="font-mono text-xs h-10"
                    dir="ltr"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                {t('services.notes')}
                <span className="text-muted-foreground ms-1 font-normal">({t('common.optional')})</span>
              </Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('services.notesPlaceholder')}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Submit */}
            <Button 
              onClick={handleSubmit}
              disabled={submitting || !isValid}
              className={cn(
                "w-full h-11 gap-2 font-bold text-white shadow-lg transition-all",
                isBuy 
                  ? "bg-gradient-to-r from-profit to-emerald-600 hover:shadow-profit/25 hover:shadow-xl" 
                  : "bg-gradient-to-r from-loss to-red-600 hover:shadow-loss/25 hover:shadow-xl",
                !isValid && "opacity-50"
              )}
            >
              <Send className="w-4 h-4" />
              {submitting ? t('common.loading') : t('services.submitRequest')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
