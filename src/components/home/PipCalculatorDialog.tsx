import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const forexPairs = [
  { value: 'EUR/USD', pipSize: 0.0001, label: 'EUR/USD' },
  { value: 'GBP/USD', pipSize: 0.0001, label: 'GBP/USD' },
  { value: 'USD/JPY', pipSize: 0.01, label: 'USD/JPY' },
  { value: 'USD/CHF', pipSize: 0.0001, label: 'USD/CHF' },
  { value: 'AUD/USD', pipSize: 0.0001, label: 'AUD/USD' },
  { value: 'NZD/USD', pipSize: 0.0001, label: 'NZD/USD' },
  { value: 'USD/CAD', pipSize: 0.0001, label: 'USD/CAD' },
  { value: 'EUR/GBP', pipSize: 0.0001, label: 'EUR/GBP' },
  { value: 'EUR/JPY', pipSize: 0.01, label: 'EUR/JPY' },
  { value: 'GBP/JPY', pipSize: 0.01, label: 'GBP/JPY' },
  { value: 'XAU/USD', pipSize: 0.01, label: 'XAU/USD (Gold)' },
  { value: 'XAG/USD', pipSize: 0.001, label: 'XAG/USD (Silver)' },
];

interface PipCalculatorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PipCalculatorDialog = ({ open, onOpenChange }: PipCalculatorDialogProps) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [pair, setPair] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const pairInfo = forexPairs.find(p => p.value === pair);

    if (!pairInfo || isNaN(entry) || isNaN(exit)) {
      setResult(isArabic ? 'يرجى تعبئة جميع الحقول بشكل صحيح' : 'Please fill all fields correctly');
      return;
    }

    const diff = Math.abs(exit - entry);
    const pips = diff / pairInfo.pipSize;
    const direction = exit > entry
      ? (isArabic ? 'صعود ⬆' : 'Up ⬆')
      : exit < entry
      ? (isArabic ? 'هبوط ⬇' : 'Down ⬇')
      : '';

    setResult(`${pips.toFixed(1)} ${isArabic ? 'نقطة' : 'pips'} ${direction}`);
  };

  const reset = () => {
    setPair('');
    setEntryPrice('');
    setExitPrice('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {isArabic ? 'حاسبة النقاط' : 'Pip Calculator'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Currency Pair */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {isArabic ? 'زوج العملات:' : 'Currency Pair:'}
            </label>
            <Select value={pair} onValueChange={setPair}>
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder={isArabic ? 'اختر الزوج' : 'Select pair'} />
              </SelectTrigger>
              <SelectContent>
                {forexPairs.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entry Price */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {isArabic ? 'سعر الدخول:' : 'Entry Price:'}
            </label>
            <Input
              type="number"
              placeholder={isArabic ? 'مثال: 1.0850' : 'e.g. 1.0850'}
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              step="any"
              className="bg-background/50"
            />
          </div>

          {/* Exit Price */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {isArabic ? 'سعر الخروج:' : 'Exit Price:'}
            </label>
            <Input
              type="number"
              placeholder={isArabic ? 'مثال: 1.0920' : 'e.g. 1.0920'}
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              step="any"
              className="bg-background/50"
            />
          </div>

          {/* Result */}
          {result && (
            <div className="rounded-xl bg-muted/50 border border-border/30 py-3 px-4 text-center">
              <span className="text-xs text-muted-foreground">{isArabic ? 'النتيجة:' : 'Result:'}</span>
              <p className="text-xl font-bold text-foreground mt-1">{result}</p>
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={calculate}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isArabic ? 'تنفيذ' : 'Calculate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
