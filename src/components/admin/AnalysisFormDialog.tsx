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
import { useAuth } from '@/hooks/useAuth';
import { useAnalyses } from '@/hooks/useAnalyses';
import { useMarketData } from '@/hooks/useMarketData';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, FileText } from 'lucide-react';

interface Analysis {
  id: string;
  title: string;
  content: string;
  symbol: string | null;
  asset_type: 'forex' | 'metals' | 'crypto' | null;
  timeframe: 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  visibility: 'free' | 'vip';
  attachments: string[];
}

interface AnalysisFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: Analysis | null;
  onSuccess: () => void;
}

export const AnalysisFormDialog = ({ open, onOpenChange, analysis, onSuccess }: AnalysisFormDialogProps) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { createAnalysis, updateAnalysis } = useAnalyses();
  const { symbols } = useMarketData(true, 5000);
  
  const [loading, setLoading] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    symbol: '' as string | null,
    asset_type: null as 'forex' | 'metals' | 'crypto' | null,
    timeframe: 'H4' as 'M5' | 'M15' | 'H1' | 'H4' | 'D1',
    visibility: 'free' as 'free' | 'vip',
    attachments: [] as string[]
  });

  // Get current market price for selected symbol
  const currentMarketPrice = useMemo(() => {
    if (!formData.symbol) return null;
    return symbols.find(s => s.symbol === formData.symbol?.toUpperCase());
  }, [formData.symbol, symbols]);

  useEffect(() => {
    if (analysis) {
      setFormData({
        title: analysis.title,
        content: analysis.content,
        symbol: analysis.symbol,
        asset_type: analysis.asset_type,
        timeframe: analysis.timeframe,
        visibility: analysis.visibility,
        attachments: analysis.attachments || []
      });
    } else {
      setFormData({
        title: '',
        content: '',
        symbol: null,
        asset_type: null,
        timeframe: 'H4',
        visibility: 'free',
        attachments: []
      });
    }
  }, [analysis, open]);

  const handleSymbolSelect = (symbol: string) => {
    const marketSymbol = symbols.find(s => s.symbol === symbol);
    setFormData(prev => ({
      ...prev,
      symbol,
      asset_type: marketSymbol?.asset_type || prev.asset_type
    }));
    setSymbolOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      title: formData.title,
      content: formData.content,
      symbol: formData.symbol,
      asset_type: formData.asset_type,
      timeframe: formData.timeframe,
      visibility: formData.visibility,
      attachments: formData.attachments,
      created_by: user?.id || null
    };

    let success = false;
    if (analysis) {
      success = await updateAnalysis(analysis.id, data);
    } else {
      success = await createAnalysis(data);
    }

    if (success) {
      onSuccess();
      onOpenChange(false);
    }
    
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {analysis ? 'تعديل التحليل' : 'نشر تحليل جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>عنوان التحليل</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="تحليل فني للذهب - فرصة شرائية"
              required
            />
          </div>

          {/* Symbol Selector */}
          <div className="space-y-2">
            <Label>الرمز (اختياري)</Label>
            <Popover open={symbolOpen} onOpenChange={setSymbolOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={symbolOpen}
                  className="w-full justify-between"
                >
                  {formData.symbol || "اختر الرمز (اختياري)..."}
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
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="trading-number">{symbol.price}</span>
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
                          <span className="trading-number">{symbol.price}</span>
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
                          <span className="trading-number">{symbol.price.toLocaleString('en-US')}</span>
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
                  <p className="text-lg font-bold trading-number">{currentMarketPrice.price}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn(
                    currentMarketPrice.change >= 0 
                      ? "text-profit border-profit/30 bg-profit/10" 
                      : "text-loss border-loss/30 bg-loss/10"
                  )}
                >
                  {currentMarketPrice.change >= 0 ? '+' : ''}{currentMarketPrice.change_percent}%
                </Badge>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>الإطار الزمني</Label>
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
              <Label>الرؤية</Label>
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
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>محتوى التحليل</Label>
            <Textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="اكتب تحليلك التفصيلي هنا..."
              className="min-h-[200px]"
              required
            />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : (analysis ? t('common.save') : 'نشر التحليل')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
