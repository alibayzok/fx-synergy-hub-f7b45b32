import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Trade {
  id: string;
  symbol: string;
  asset_type: string;
  direction: string;
  entry_type?: string;
  entry_price: number;
  sl_price: number;
  tp_prices: number[];
  timeframe?: string;
  status: string;
  visibility: string;
  reason: string;
  risk_note?: string;
  alternative_scenario?: string;
}

interface TradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trade: Trade | null;
  onSuccess: () => void;
}

export const TradeFormDialog = ({ open, onOpenChange, trade, onSuccess }: TradeFormDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    symbol: '',
    asset_type: 'forex' as const,
    direction: 'buy' as const,
    entry_type: 'market' as const,
    entry_price: '',
    sl_price: '',
    tp_prices: '',
    timeframe: 'H1' as const,
    status: 'pending' as const,
    visibility: 'free' as const,
    reason: '',
    risk_note: '',
    alternative_scenario: ''
  });

  useEffect(() => {
    if (trade) {
      setFormData({
        symbol: trade.symbol,
        asset_type: trade.asset_type as any,
        direction: trade.direction as any,
        entry_type: (trade.entry_type || 'market') as any,
        entry_price: String(trade.entry_price),
        sl_price: String(trade.sl_price),
        tp_prices: trade.tp_prices.join(', '),
        timeframe: (trade.timeframe || 'H1') as any,
        status: trade.status as any,
        visibility: trade.visibility as any,
        reason: trade.reason,
        risk_note: trade.risk_note || '',
        alternative_scenario: trade.alternative_scenario || ''
      });
    } else {
      setFormData({
        symbol: '',
        asset_type: 'forex',
        direction: 'buy',
        entry_type: 'market',
        entry_price: '',
        sl_price: '',
        tp_prices: '',
        timeframe: 'H1',
        status: 'pending',
        visibility: 'free',
        reason: '',
        risk_note: '',
        alternative_scenario: ''
      });
    }
  }, [trade, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tpArray = formData.tp_prices
      .split(',')
      .map(s => parseFloat(s.trim()))
      .filter(n => !isNaN(n));

    const tradeData = {
      symbol: formData.symbol.toUpperCase(),
      asset_type: formData.asset_type,
      direction: formData.direction,
      entry_type: formData.entry_type,
      entry_price: parseFloat(formData.entry_price),
      sl_price: parseFloat(formData.sl_price),
      tp_prices: tpArray,
      timeframe: formData.timeframe,
      status: formData.status,
      visibility: formData.visibility,
      reason: formData.reason,
      risk_note: formData.risk_note || null,
      alternative_scenario: formData.alternative_scenario || null,
      created_by: user?.id
    };

    try {
      if (trade) {
        const { error } = await supabase
          .from('trades')
          .update(tradeData)
          .eq('id', trade.id);

        if (error) throw error;
        toast({ title: t('admin.tradeUpdated') });
      } else {
        const { error } = await supabase
          .from('trades')
          .insert(tradeData);

        if (error) throw error;
        toast({ title: t('admin.tradeCreated') });
      }
      onSuccess();
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {trade ? t('admin.editTrade') : t('admin.newTrade')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('trades.symbol')}</Label>
              <Input
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                placeholder="XAUUSD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t('trades.assetType')}</Label>
              <Select
                value={formData.asset_type}
                onValueChange={(v: any) => setFormData({ ...formData, asset_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forex">{t('markets.forex')}</SelectItem>
                  <SelectItem value="metals">{t('markets.metals')}</SelectItem>
                  <SelectItem value="crypto">{t('markets.crypto')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('trades.direction')}</Label>
              <Select
                value={formData.direction}
                onValueChange={(v: any) => setFormData({ ...formData, direction: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">{t('trades.buy')}</SelectItem>
                  <SelectItem value="sell">{t('trades.sell')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('trades.entryType')}</Label>
              <Select
                value={formData.entry_type}
                onValueChange={(v: any) => setFormData({ ...formData, entry_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market">{t('trades.market')}</SelectItem>
                  <SelectItem value="limit">{t('trades.limit')}</SelectItem>
                  <SelectItem value="stop">{t('trades.stop')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('trades.entry')}</Label>
              <Input
                type="number"
                step="any"
                value={formData.entry_price}
                onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                placeholder="2350.50"
                required
                className="trading-number"
              />
            </div>
            <div className="space-y-2">
              <Label>{t('trades.stopLoss')}</Label>
              <Input
                type="number"
                step="any"
                value={formData.sl_price}
                onChange={(e) => setFormData({ ...formData, sl_price: e.target.value })}
                placeholder="2340.00"
                required
                className="trading-number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('trades.takeProfit')} ({t('admin.commaSeparated')})</Label>
            <Input
              value={formData.tp_prices}
              onChange={(e) => setFormData({ ...formData, tp_prices: e.target.value })}
              placeholder="2360.00, 2370.00, 2380.00"
              className="trading-number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('trades.timeframe')}</Label>
              <Select
                value={formData.timeframe}
                onValueChange={(v: any) => setFormData({ ...formData, timeframe: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M5">M5</SelectItem>
                  <SelectItem value="M15">M15</SelectItem>
                  <SelectItem value="H1">H1</SelectItem>
                  <SelectItem value="H4">H4</SelectItem>
                  <SelectItem value="D1">D1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('trades.status')}</Label>
              <Select
                value={formData.status}
                onValueChange={(v: any) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('trades.pending')}</SelectItem>
                  <SelectItem value="running">{t('trades.running')}</SelectItem>
                  <SelectItem value="tp_hit">{t('trades.tp_hit')}</SelectItem>
                  <SelectItem value="sl_hit">{t('trades.sl_hit')}</SelectItem>
                  <SelectItem value="cancelled">{t('trades.cancelled')}</SelectItem>
                  <SelectItem value="closed_manual">{t('trades.closed_manual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('trades.visibility')}</Label>
            <Select
              value={formData.visibility}
              onValueChange={(v: any) => setFormData({ ...formData, visibility: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t('trades.free')}</SelectItem>
                <SelectItem value="vip">{t('trades.vip')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('trades.reason')}</Label>
            <Textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder={t('admin.reasonPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('trades.risk')} ({t('common.optional')})</Label>
            <Input
              value={formData.risk_note}
              onChange={(e) => setFormData({ ...formData, risk_note: e.target.value })}
              placeholder={t('admin.riskPlaceholder')}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : (trade ? t('common.save') : t('common.submit'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
