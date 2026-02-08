import { useState, useEffect, useMemo } from 'react';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useMarketData } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';

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
  const { symbols } = useMarketData(true, 3000);
  
  const [loading, setLoading] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);

  const [formData, setFormData] = useState({
    symbol: '',
    asset_type: 'forex' as 'forex' | 'metals' | 'crypto',
    direction: 'buy' as 'buy' | 'sell',
    entry_type: 'market' as 'market' | 'limit' | 'stop',
    entry_price: '',
    sl_price: '',
    tp_prices: '',
    timeframe: 'H1' as 'M5' | 'M15' | 'H1' | 'H4' | 'D1',
    status: 'pending' as 'pending' | 'running' | 'tp_hit' | 'sl_hit' | 'cancelled' | 'closed_manual',
    visibility: 'free' as 'free' | 'vip',
    reason: '',
    risk_note: '',
    alternative_scenario: ''
  });

  // Get current market price for selected symbol
  const currentMarketPrice = useMemo(() => {
    if (!formData.symbol) return null;
    return symbols.find(s => s.symbol === formData.symbol.toUpperCase());
  }, [formData.symbol, symbols]);

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

  // Auto-set entry price when symbol is selected and entry type is market
  const handleSymbolSelect = (symbol: string) => {
    const marketSymbol = symbols.find(s => s.symbol === symbol);
    setFormData(prev => ({
      ...prev,
      symbol,
      asset_type: marketSymbol?.asset_type || prev.asset_type,
      entry_price: prev.entry_type === 'market' && marketSymbol 
        ? String(marketSymbol.price) 
        : prev.entry_price
    }));
    setSymbolOpen(false);
  };

  // Use current price as entry for market orders
  const handleUseCurrentPrice = () => {
    if (currentMarketPrice) {
      setFormData(prev => ({
        ...prev,
        entry_price: String(currentMarketPrice.price)
      }));
    }
  };

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
          {/* Symbol Selector with Live Prices */}
          <div className="space-y-2">
            <Label>{t('trades.symbol')}</Label>
            <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={symbolOpen}
                  className="w-full justify-between"
                >
                  {formData.symbol || "اختر الرمز..."}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="ابحث عن رمز..." />
                  <CommandList>
                    <CommandEmpty>لم يتم العثور على رموز</CommandEmpty>
                    <CommandGroup heading="الفوركس">
                      {symbols.filter(s => s.asset_type === 'forex').map((symbol) => (
                        <CommandItem
                          key={symbol.symbol}
                          value={symbol.symbol}
                          onSelect={() => handleSymbolSelect(symbol.symbol)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                formData.symbol === symbol.symbol ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{symbol.symbol}</span>
                            <span className="text-xs text-muted-foreground">{symbol.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="trading-number font-medium">{symbol.price}</span>
                            {symbol.change >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-profit" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-loss" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="المعادن">
                      {symbols.filter(s => s.asset_type === 'metals').map((symbol) => (
                        <CommandItem
                          key={symbol.symbol}
                          value={symbol.symbol}
                          onSelect={() => handleSymbolSelect(symbol.symbol)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                formData.symbol === symbol.symbol ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{symbol.symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="trading-number font-medium">{symbol.price}</span>
                            {symbol.change >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-profit" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-loss" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="العملات الرقمية">
                      {symbols.filter(s => s.asset_type === 'crypto').map((symbol) => (
                        <CommandItem
                          key={symbol.symbol}
                          value={symbol.symbol}
                          onSelect={() => handleSymbolSelect(symbol.symbol)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <Check
                              className={cn(
                                "h-4 w-4",
                                formData.symbol === symbol.symbol ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-medium">{symbol.symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="trading-number font-medium">{symbol.price.toLocaleString('en-US')}</span>
                            {symbol.change >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-profit" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-loss" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Live Price Display */}
          {currentMarketPrice && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">السعر الحالي</p>
                  <p className="text-xl font-bold trading-number">{currentMarketPrice.price}</p>
                </div>
                <div className="text-end">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "mb-1",
                      currentMarketPrice.change >= 0 
                        ? "text-profit border-profit/30 bg-profit/10" 
                        : "text-loss border-loss/30 bg-loss/10"
                    )}
                  >
                    {currentMarketPrice.change >= 0 ? '+' : ''}{currentMarketPrice.change_percent}%
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-profit trading-number">H: {currentMarketPrice.high}</span>
                    <span className="mx-1">|</span>
                    <span className="text-loss trading-number">L: {currentMarketPrice.low}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t('trades.direction')}</Label>
              <Select
                value={formData.direction}
                onValueChange={(v: any) => setFormData({ ...formData, direction: v })}
              >
                <SelectTrigger className={cn(
                  formData.direction === 'buy' ? 'border-profit/50 bg-profit/10' : 'border-loss/50 bg-loss/10'
                )}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy">
                    <span className="flex items-center gap-2 text-profit font-medium">
                      <TrendingUp className="w-4 h-4" />
                      {t('trades.buy')}
                    </span>
                  </SelectItem>
                  <SelectItem value="sell">
                    <span className="flex items-center gap-2 text-loss font-medium">
                      <TrendingDown className="w-4 h-4" />
                      {t('trades.sell')}
                    </span>
                  </SelectItem>
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
              <div className="flex items-center justify-between">
                <Label>{t('trades.entry')}</Label>
                {currentMarketPrice && formData.entry_type === 'market' && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs text-primary"
                    onClick={handleUseCurrentPrice}
                  >
                    استخدم الحالي
                    <ArrowRight className="w-3 h-3 ms-1" />
                  </Button>
                )}
              </div>
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
                className="trading-number text-loss"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t('trades.takeProfit')} ({t('admin.commaSeparated')})</Label>
            <Input
              value={formData.tp_prices}
              onChange={(e) => setFormData({ ...formData, tp_prices: e.target.value })}
              placeholder="2360.00, 2370.00, 2380.00"
              className="trading-number text-profit"
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
