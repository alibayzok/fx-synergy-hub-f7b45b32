import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Briefcase, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useServiceRequests, ServiceType } from '@/hooks/useServiceRequests';

interface BrokerRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'broker_account' | 'broker_deposit' | 'broker_withdraw';
  onSuccess?: () => void;
}

export const BrokerRequestDialog = ({ 
  open, 
  onOpenChange, 
  type,
  onSuccess 
}: BrokerRequestDialogProps) => {
  const { t } = useTranslation();
  const { createRequest } = useServiceRequests();
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const isAccountRequest = type === 'broker_account';

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await createRequest({
      type: type as ServiceType,
      amount: amount ? parseFloat(amount) : undefined,
      notes: notes || undefined,
    });

    setSubmitting(false);

    if (result) {
      setAmount('');
      setNotes('');
      onOpenChange(false);
      onSuccess?.();
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'broker_account':
        return t('services.openBrokerAccount');
      case 'broker_deposit':
        return t('services.brokerRequest') + ' - ' + t('services.deposit');
      case 'broker_withdraw':
        return t('services.brokerRequest') + ' - ' + t('services.withdraw');
      default:
        return t('services.brokerRequest');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          {isAccountRequest && (
            <DialogDescription>
              {t('services.openBrokerAccountDesc')}
            </DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          {isAccountRequest && (
            <div className="p-4 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">OR</span>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">OneRoyal</h4>
                  <p className="text-xs text-muted-foreground">Official Partner</p>
                </div>
              </div>
              <ul className="space-y-1.5 text-sm">
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit flex-shrink-0" />
                  {t('services.brokerBenefit1')}
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit flex-shrink-0" />
                  {t('services.brokerBenefit2')}
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-profit flex-shrink-0" />
                  {t('services.brokerBenefit3')}
                </li>
              </ul>
            </div>
          )}

          {!isAccountRequest && (
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('services.amount')} (USD)</label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="trading-number"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t('services.notes')} 
              <span className="text-muted-foreground ms-1">({t('common.optional')})</span>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAccountRequest ? t('services.brokerNotesPlaceholder') : t('services.notesPlaceholder')}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            className="w-full gap-2" 
            disabled={submitting || (!isAccountRequest && !amount)}
          >
            <Send className="w-4 h-4" />
            {submitting ? t('common.loading') : t('services.submitRequest')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
