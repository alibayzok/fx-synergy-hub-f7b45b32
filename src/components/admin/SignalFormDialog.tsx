import { useState, useMemo, useRef } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, TrendingUp, TrendingDown, Plus, X, Radio, ImagePlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [customSymbol, setCustomSymbol] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const maxFiles = 4;
    const totalFiles = selectedFiles.length + files.length;
    if (totalFiles > maxFiles) {
      toast({ title: `يمكنك رفع ${maxFiles} صور كحد أقصى`, variant: 'destructive' });
      return;
    }

    const newFiles = [...selectedFiles, ...files];
    setSelectedFiles(newFiles);

    // Generate previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previewUrls[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (): Promise<string[]> => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const urls: string[] = [];

    try {
      for (const file of selectedFiles) {
        const ext = file.name.split('.').pop();
        const path = `${user?.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error } = await supabase.storage
          .from('signal-attachments')
          .upload(path, file);

        if (error) throw error;

        const { data: urlData } = supabase.storage
          .from('signal-attachments')
          .getPublicUrl(path);

        urls.push(urlData.publicUrl);
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast({ title: 'خطأ في رفع الصور', variant: 'destructive' });
    } finally {
      setUploading(false);
    }

    return urls;
  };

  const resetForm = () => {
    setForm(defaultForm);
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviewUrls([]);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);

    // Upload images first
    const attachmentUrls = await uploadFiles();

    const payload = {
      title: form.title, content: form.content, symbol: form.symbol || null,
      asset_type: form.asset_type as any, timeframe: form.timeframe as any,
      visibility: form.visibility as any, created_by: user?.id || null,
      attachments: attachmentUrls.length > 0 ? attachmentUrls : null,
    };
    await createSignal(payload as any);
    setSaving(false);
    onOpenChange(false);
    resetForm();
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
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

          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>صور الشارت</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {/* Preview Grid */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative rounded-xl overflow-hidden aspect-video bg-muted/50 border border-border/50 group">
                    <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {selectedFiles.length < 4 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="w-full rounded-xl gap-2 border-dashed border-2 h-10 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                <ImagePlus className="w-4 h-4" />
                {selectedFiles.length === 0 ? 'إضافة صور الشارت' : `إضافة المزيد (${selectedFiles.length}/4)`}
              </Button>
            )}
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
            <div className="col-span-2">
              <Label>الرؤية</Label>
              <div className="grid grid-cols-2 gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, visibility: 'free' }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                    form.visibility === 'free'
                      ? "bg-primary/15 text-primary border-primary/40 shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                  )}
                >
                  <TrendingUp className="w-4 h-4" />
                  مجاني
                </button>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, visibility: 'vip' }))}
                  className={cn(
                    "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all border",
                    form.visibility === 'vip'
                      ? "bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-500 border-amber-500/40 shadow-sm"
                      : "bg-muted/30 text-muted-foreground border-border/40 hover:bg-muted/50"
                  )}
                >
                  👑 VIP
                </button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">{t('common.cancel')}</Button>
          <Button onClick={handleSubmit} disabled={saving || uploading || !form.title || !form.content} className="rounded-xl gap-2">
            {(saving || uploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {uploading ? 'جاري رفع الصور...' : saving ? 'جاري النشر...' : 'نشر'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
