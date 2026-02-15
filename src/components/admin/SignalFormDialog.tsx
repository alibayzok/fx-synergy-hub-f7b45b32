import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/hooks/useAuth';
import { useSignals } from '@/hooks/useSignals';
import { useMarketData } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Plus, X, Radio } from 'lucide-react';

interface SignalFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const defaultForm = {
  title: '', content: '', symbol: '', asset_type: 'forex', timeframe: 'H4', visibility: 'free',
};

export const SignalFormDialog = ({ open, onOpenChange, onSuccess }: SignalFormDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createSignal } = useSignals();
  const { symbols: marketSymbols } = useMarketData(true, 5000);

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');

  const currentMarketPrice = useMemo(() => {
    if (!form.symbol) return null;
    return marketSymbols.find(s => s.symbol === form.symbol.toUpperCase());
  }, [form.symbol, marketSymbols]);

  const handleSymbolSelect = (symbol: string) => {
    const marketSymbol = marketSymbols.find(s => s.symbol === symbol);
    setForm(f => ({ ...f, symbol, asset_type: marketSymbol?.asset_type || f.asset_type }));
    setSymbolOpen(false);
    setCustomSymbol('');
  };

  const handleCustomSymbol = () => {
    if (customSymbol.trim()) {
      setForm(f => ({ ...f, symbol: customSymbol.trim().toUpperCase() }));
      setSymbolOpen(false);
      setCustomSymbol('');
    }
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    const payload = {
      title: form.title, content: form.content, symbol: form.symbol || null,
      asset_type: form.asset_type as any, timeframe: form.timeframe as any,
      visibility: form.visibility as any, created_by: user?.id || null,
    };
    await createSignal(payload as any);
    setSaving(false);
    onOpenChange(false);
    setForm(defaultForm);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setForm(defaultForm); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Radio className="w-5 h-5" />
            نشر إشارة جديدة
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>العنوان</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان الإشارة" className="rounded-xl" />
          </div>
          <div>
            <Label>المحتوى</Label>
            <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="تفاصيل الإشارة..." rows={5} className="rounded-xl" />
          </div>
          {/* Symbol Combobox */}
          <div className="space-y-2">
            <Label>الرمز</Label>
            <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={symbolOpen} className="w-full justify-between rounded-xl">
                  {form.symbol || "اختر أو اكتب رمز..."}
                  <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="ابحث أو اكتب رمز جديد..." value={customSymbol} onValueChange={setCustomSymbol} />
                  <CommandList>
                    {customSymbol && !marketSymbols.find(s => s.symbol === customSymbol.toUpperCase()) && (
                      <CommandGroup heading="رمز مخصص">
                        <CommandItem value={`custom-${customSymbol}`} onSelect={handleCustomSymbol} className="flex items-center gap-2">
                          <Plus className="w-4 h-4 text-primary" />
                          <span>استخدام "<strong>{customSymbol.toUpperCase()}</strong>"</span>
                        </CommandItem>
                      </CommandGroup>
                    )}
                    <CommandEmpty>اكتب رمز مخصص واضغط لإضافته</CommandEmpty>
                    <CommandGroup heading="الفوركس">
                      {marketSymbols.filter(s => s.asset_type === 'forex').map((symbol) => (
                        <CommandItem key={symbol.symbol} value={symbol.symbol} onSelect={() => handleSymbolSelect(symbol.symbol)} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className={cn("h-4 w-4", form.symbol === symbol.symbol ? "opacity-100" : "opacity-0")} />
                            <span className="font-medium">{symbol.symbol}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="trading-number text-xs">{symbol.price}</span>
                            {symbol.change >= 0 ? <TrendingUp className="w-3 h-3 text-profit" /> : <TrendingDown className="w-3 h-3 text-loss" />}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="المعادن">
                      {marketSymbols.filter(s => s.asset_type === 'metals').map((symbol) => (
                        <CommandItem key={symbol.symbol} value={symbol.symbol} onSelect={() => handleSymbolSelect(symbol.symbol)} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className={cn("h-4 w-4", form.symbol === symbol.symbol ? "opacity-100" : "opacity-0")} />
                            <span className="font-medium">{symbol.symbol}</span>
                          </div>
                          <span className="trading-number text-xs">{symbol.price}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    <CommandGroup heading="العملات الرقمية">
                      {marketSymbols.filter(s => s.asset_type === 'crypto').map((symbol) => (
                        <CommandItem key={symbol.symbol} value={symbol.symbol} onSelect={() => handleSymbolSelect(symbol.symbol)} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Check className={cn("h-4 w-4", form.symbol === symbol.symbol ? "opacity-100" : "opacity-0")} />
                            <span className="font-medium">{symbol.symbol}</span>
                          </div>
                          <span className="trading-number text-xs">{symbol.price.toLocaleString('en-US')}</span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {form.symbol && (
              <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setForm(f => ({ ...f, symbol: '' }))}>
                <X className="w-3 h-3 me-1" /> مسح الرمز
              </Button>
            )}
          </div>

          {/* Live Price */}
          {currentMarketPrice && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">السعر الحالي</p>
                  <p className="text-lg font-bold trading-number">{currentMarketPrice.price}</p>
                </div>
                <Badge variant="outline" className={cn(
                  currentMarketPrice.change >= 0 ? "text-profit border-profit/30 bg-profit/10" : "text-loss border-loss/30 bg-loss/10"
                )}>
                  {currentMarketPrice.change >= 0 ? '+' : ''}{currentMarketPrice.change_percent}%
                </Badge>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>نوع الأصل</Label>
              <Select value={form.asset_type} onValueChange={v => setForm(f => ({ ...f, asset_type: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="forex">فوركس</SelectItem>
                  <SelectItem value="crypto">كريبتو</SelectItem>
                  <SelectItem value="metals">معادن</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الإطار الزمني</Label>
              <Select value={form.timeframe} onValueChange={v => setForm(f => ({ ...f, timeframe: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['M5', 'M15', 'H1', 'H4', 'D1'].map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الرؤية</Label>
              <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">مجاني</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title || !form.content} className="rounded-xl">
            {saving ? 'جاري النشر...' : 'نشر'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
