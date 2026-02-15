import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Wallet } from 'lucide-react';
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

// Payment methods are managed from CMS app settings:
// usdt_payment_methods: comma-separated list of "key:label" e.g. "omt:OMT,whish:Whish Money,cash:نقدي"

export const UsdtRequestForm = ({ selectedType, onSuccess }: UsdtRequestFormProps) => {
  const { t } = useTranslation();
  const { getSetting } = useAppSettings();
  const { createRequest } = useServiceRequests();
  const [submitting, setSubmitting] = useState(false);

  const paymentMethods = useMemo(() => {
    const raw = (getSetting('usdt_payment_methods', '') || '').trim();
    // format: key:label,key2:label2
    if (!raw) {
      return [
        { value: 'bank_transfer', label: t('services.usdtSection.paymentMethods.bank_transfer') },
        { value: 'omt', label: t('services.usdtSection.paymentMethods.omt') },
        { value: 'whish', label: t('services.usdtSection.paymentMethods.whish') },
        { value: 'cash', label: t('services.usdtSection.paymentMethods.cash') },
      ];
    }
    return raw
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((pair) => {
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
    
    // For buy requests, wallet address is required
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
      setFormData({
        amount: '',
        network: 'TRC20',
        paymentMethod: '',
        walletAddress: '',
        notes: '',
      });
      onSuccess?.();
    }
  };

  const isBuy = selectedType === 'buy';

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      isBuy 
        ? "bg-gradient-to-br from-profit/5 to-transparent border-profit/20" 
        : "bg-gradient-to-br from-loss/5 to-transparent border-loss/20"
    )}>
      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Wallet className={cn("w-5 h-5", isBuy ? "text-profit" : "text-loss")} />
        {isBuy ? t('services.usdtSection.buyRequest') : t('services.usdtSection.sellRequest')}
      </h3>

      <div className="space-y-4">
        {/* Amount */}
        <div className="space-y-2">
          <Label>{t('services.amount')} (USDT)</Label>
          <Input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            placeholder="100"
            className="trading-number"
          />
        </div>

        {/* Network */}
        <div className="space-y-2">
          <Label>{t('services.network')}</Label>
          <Select
            value={formData.network}
            onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {NETWORKS.map((network) => (
                <SelectItem key={network.value} value={network.value}>
                  {network.label}
                  {network.recommended && (
                    <span className="text-xs text-profit ms-2">
                      ({t('services.usdtSection.recommended')})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Payment Method */}
        <div className="space-y-2">
          <Label>{t('services.usdtSection.paymentMethod')}</Label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
          >
            <SelectTrigger>
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

        {/* Wallet Address (only for buy) */}
        {isBuy && (
          <div className="space-y-2">
            <Label>
              {t('services.usdtSection.walletAddress')}
              <span className="text-xs text-muted-foreground ms-1">
                ({formData.network})
              </span>
            </Label>
            <Input
              value={formData.walletAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
              placeholder={t('services.usdtSection.walletPlaceholder')}
              className="font-mono text-sm"
              dir="ltr"
            />
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label>
            {t('services.notes')}
            <span className="text-muted-foreground ms-1">({t('common.optional')})</span>
          </Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={t('services.notesPlaceholder')}
            rows={2}
          />
        </div>

        {/* Submit Button */}
        <Button 
          onClick={handleSubmit}
          disabled={submitting || !formData.amount || !formData.paymentMethod || (isBuy && !formData.walletAddress)}
          className={cn(
            "w-full gap-2",
            isBuy 
              ? "bg-profit hover:bg-profit/90" 
              : "bg-loss hover:bg-loss/90"
          )}
        >
          <Send className="w-4 h-4" />
          {submitting ? t('common.loading') : t('services.submitRequest')}
        </Button>
      </div>
    </div>
  );
};
