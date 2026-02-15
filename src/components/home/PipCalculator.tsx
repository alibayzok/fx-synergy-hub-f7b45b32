import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const forexPairs = [
  { value: 'EUR/USD', pipSize: 0.0001 },
  { value: 'GBP/USD', pipSize: 0.0001 },
  { value: 'USD/JPY', pipSize: 0.01 },
  { value: 'USD/CHF', pipSize: 0.0001 },
  { value: 'AUD/USD', pipSize: 0.0001 },
  { value: 'NZD/USD', pipSize: 0.0001 },
  { value: 'USD/CAD', pipSize: 0.0001 },
  { value: 'EUR/GBP', pipSize: 0.0001 },
  { value: 'EUR/JPY', pipSize: 0.01 },
  { value: 'GBP/JPY', pipSize: 0.01 },
  { value: 'XAU/USD', pipSize: 0.01 },
  { value: 'XAG/USD', pipSize: 0.001 },
];

const accountCurrencies = ['USD', 'EUR', 'GBP'];

export const PipCalculator = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [pips, setPips] = useState('');
  const [pair, setPair] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [accountCurrency, setAccountCurrency] = useState('USD');
  const [result, setResult] = useState<string | null>(null);

  const calculate = () => {
    const pipsNum = parseFloat(pips);
    const lotsNum = parseFloat(lotSize);
    const pairInfo = forexPairs.find(p => p.value === pair);

    if (!pairInfo || isNaN(pipsNum) || isNaN(lotsNum) || lotsNum <= 0) {
      setResult(isArabic ? 'يرجى تعبئة جميع الحقول بشكل صحيح' : 'Please fill all fields correctly');
      return;
    }

    // Standard lot = 100,000 units
    const unitSize = 100000;
    const pipValue = pairInfo.pipSize * unitSize * lotsNum * pipsNum;

    setResult(`${pipValue.toFixed(2)} ${accountCurrency}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Calculator className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-muted-foreground">
          {isArabic ? 'حاسبة قيمة النقطة' : 'Pip Value Calculator'}
        </h2>
      </div>

      <div className="rounded-xl bg-card/60 border border-border/40 p-4 space-y-3">
        {/* Pips */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {isArabic ? 'عدد النقاط:' : 'Number of Pips:'}
          </label>
          <Input
            type="number"
            placeholder={isArabic ? 'مثال: 50' : 'e.g. 50'}
            value={pips}
            onChange={(e) => setPips(e.target.value)}
            className="bg-background/50"
          />
        </div>

        {/* Currency Pair */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {isArabic ? 'زوج العملات:' : 'Currency Pair:'}
          </label>
          <Select value={pair} onValueChange={setPair}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder={isArabic ? 'اختر الزوج' : 'Select pair'} />
            </SelectTrigger>
            <SelectContent>
              {forexPairs.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Lot Size */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {isArabic ? 'حجم التداول (عقود):' : 'Lot Size:'}
          </label>
          <Input
            type="number"
            placeholder={isArabic ? 'مثال: 1.0' : 'e.g. 1.0'}
            value={lotSize}
            onChange={(e) => setLotSize(e.target.value)}
            step="0.01"
            className="bg-background/50"
          />
        </div>

        {/* Account Currency */}
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            {isArabic ? 'عملة الإيداع:' : 'Account Currency:'}
          </label>
          <Select value={accountCurrency} onValueChange={setAccountCurrency}>
            <SelectTrigger className="bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accountCurrencies.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Result */}
        {result && (
          <div className="rounded-lg bg-muted/50 border border-border/30 py-2.5 px-3 text-center">
            <span className="text-xs text-muted-foreground">{isArabic ? 'النتيجة:' : 'Result:'}</span>
            <p className="text-lg font-bold text-foreground mt-0.5">{result}</p>
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
    </motion.div>
  );
};
