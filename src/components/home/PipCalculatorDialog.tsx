import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface PairConfig {
  value: string;
  label: string;
  pipSize: number;      // price movement per 1 pip
  pipDecimals: number;   // decimals to show in result
}

const forexPairs: PairConfig[] = [
  { value: 'EUR/USD', label: 'EUR/USD', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'GBP/USD', label: 'GBP/USD', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'AUD/USD', label: 'AUD/USD', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'NZD/USD', label: 'NZD/USD', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'USD/CHF', label: 'USD/CHF', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'USD/CAD', label: 'USD/CAD', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'EUR/GBP', label: 'EUR/GBP', pipSize: 0.0001, pipDecimals: 1 },
  { value: 'USD/JPY', label: 'USD/JPY', pipSize: 0.01, pipDecimals: 1 },
  { value: 'EUR/JPY', label: 'EUR/JPY', pipSize: 0.01, pipDecimals: 1 },
  { value: 'GBP/JPY', label: 'GBP/JPY', pipSize: 0.01, pipDecimals: 1 },
  { value: 'AUD/JPY', label: 'AUD/JPY', pipSize: 0.01, pipDecimals: 1 },
  { value: 'CAD/JPY', label: 'CAD/JPY', pipSize: 0.01, pipDecimals: 1 },
  { value: 'XAU/USD', label: 'XAU/USD (Gold)', pipSize: 0.10, pipDecimals: 0 },
  { value: 'XAG/USD', label: 'XAG/USD (Silver)', pipSize: 0.01, pipDecimals: 0 },
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
  const [result, setResult] = useState<{ pips: string; direction: string } | null>(null);
  const [error, setError] = useState('');

  const calculate = () => {
    setError('');
    setResult(null);

    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const pairInfo = forexPairs.find(p => p.value === pair);

    if (!pairInfo) {
      setError(isArabic ? 'يرجى اختيار زوج العملات' : 'Please select a currency pair');
      return;
    }
    if (isNaN(entry) || entry <= 0) {
      setError(isArabic ? 'يرجى إدخال سعر دخول صحيح' : 'Please enter a valid entry price');
      return;
    }
    if (isNaN(exit) || exit <= 0) {
      setError(isArabic ? 'يرجى إدخال سعر خروج صحيح' : 'Please enter a valid exit price');
      return;
    }

    const diff = exit - entry;
    const pipsCount = Math.abs(diff) / pairInfo.pipSize;

    let direction = '';
    if (diff > 0) {
      direction = isArabic ? '📈 صعود (شراء رابح)' : '📈 Bullish (Buy wins)';
    } else if (diff < 0) {
      direction = isArabic ? '📉 هبوط (بيع رابح)' : '📉 Bearish (Sell wins)';
    }

    setResult({
      pips: pipsCount.toFixed(pairInfo.pipDecimals),
      direction,
    });
  };

  const reset = () => {
    setPair('');
    setEntryPrice('');
    setExitPrice('');
    setResult(null);
    setError('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="sm:max-w-md" aria-describedby="pip-calc-desc">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-primary" />
            {isArabic ? 'حاسبة النقاط (Pips)' : 'Pip Calculator'}
          </DialogTitle>
          <DialogDescription id="pip-calc-desc">
            {isArabic ? 'احسب عدد النقاط بين سعر الدخول وسعر الخروج' : 'Calculate pips between entry and exit price'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Currency Pair */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {isArabic ? 'زوج العملات:' : 'Currency Pair:'}
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="">{isArabic ? '-- اختر الزوج --' : '-- Select pair --'}</option>
              {forexPairs.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Entry Price */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {isArabic ? 'سعر الدخول:' : 'Entry Price:'}
            </label>
            <Input
              type="number"
              placeholder={pair.includes('JPY') ? '150.250' : pair.includes('XAU') ? '2350.50' : '1.08500'}
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              step="any"
              className="bg-background/50 tabular-nums"
            />
          </div>

          {/* Exit Price */}
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
              {isArabic ? 'سعر الخروج:' : 'Exit Price:'}
            </label>
            <Input
              type="number"
              placeholder={pair.includes('JPY') ? '151.000' : pair.includes('XAU') ? '2365.00' : '1.09200'}
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              step="any"
              className="bg-background/50 tabular-nums"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive text-center font-medium">{error}</p>
          )}

          {/* Result */}
          {result && (
            <div className="rounded-xl bg-muted/50 border border-border/30 py-3 px-4 text-center space-y-1">
              <span className="text-xs text-muted-foreground">{isArabic ? 'عدد النقاط:' : 'Pips:'}</span>
              <p className="text-2xl font-bold text-foreground tabular-nums">{result.pips} <span className="text-sm font-medium text-muted-foreground">{isArabic ? 'نقطة' : 'pips'}</span></p>
              {result.direction && (
                <p className="text-sm font-medium text-muted-foreground">{result.direction}</p>
              )}
            </div>
          )}

          {/* Calculate Button */}
          <Button
            onClick={calculate}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
          >
            {isArabic ? 'احسب' : 'Calculate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
