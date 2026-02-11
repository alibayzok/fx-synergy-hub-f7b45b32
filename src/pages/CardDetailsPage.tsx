import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  CreditCard, ArrowRight, ArrowLeft, Eye, EyeOff, Snowflake, Play, X,
  Loader2, Copy, Check, ShieldCheck, Calendar, DollarSign, Hash,
  ArrowUpRight, ArrowDownLeft, Clock, RefreshCw
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVirtualCards } from '@/hooks/useVirtualCards';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const CardDetailsPage = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const { cards, loading, actionLoading, freezeCard, unfreezeCard, cancelCard, getCardDetails, getTransactions } = useVirtualCards();

  const [cardDetails, setCardDetails] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [showSensitive, setShowSensitive] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const card = cards.find(c => c.id === cardId);

  useEffect(() => {
    if (!cardId || loading) return;
    const load = async () => {
      setDetailsLoading(true);
      setTxLoading(true);
      const [details, txData] = await Promise.all([
        getCardDetails(cardId),
        getTransactions(cardId),
      ]);
      if (details) setCardDetails(details);
      if (txData) setTransactions(txData.transactions || []);
      setDetailsLoading(false);
      setTxLoading(false);
    };
    load();
  }, [cardId, loading]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(isRTL ? 'تم النسخ' : 'Copied');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return { label: isRTL ? 'نشطة' : 'Active', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', dotColor: 'bg-emerald-400' };
      case 'frozen':
        return { label: isRTL ? 'مجمدة' : 'Frozen', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30', dotColor: 'bg-blue-400' };
      case 'cancelled':
        return { label: isRTL ? 'ملغاة' : 'Cancelled', className: 'bg-red-500/20 text-red-400 border-red-500/30', dotColor: 'bg-red-400' };
      default:
        return { label: isRTL ? 'معلقة' : 'Pending', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', dotColor: 'bg-yellow-400' };
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!card) {
    return (
      <AppLayout>
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <CreditCard className="w-16 h-16 text-muted-foreground" />
          <h2 className="text-xl font-bold text-foreground">{isRTL ? 'البطاقة غير موجودة' : 'Card not found'}</h2>
          <Button onClick={() => navigate('/services')} variant="outline">
            {isRTL ? 'العودة للخدمات' : 'Back to Services'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = getStatusConfig(card.card_status);
  const marqetaDetails = cardDetails?.marqeta_details;

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/services')}>
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
          </Button>
          <h1 className="text-lg font-bold text-foreground flex-1">{isRTL ? 'تفاصيل البطاقة' : 'Card Details'}</h1>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-4 space-y-5">
        {/* Card Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl"
        >
          <div className="relative p-6 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 text-white min-h-[200px]">
            {/* Decorative circles */}
            <div className="absolute top-[-30px] end-[-30px] w-40 h-40 bg-white/10 rounded-full" />
            <div className="absolute bottom-[-20px] start-[-20px] w-28 h-28 bg-white/5 rounded-full" />

            <div className="relative space-y-6">
              {/* Top */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  <span className="font-semibold text-lg">{card.nickname || (isRTL ? 'بطاقة افتراضية' : 'Virtual Card')}</span>
                </div>
                <Badge className={status.className}>
                  <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor} me-1.5`} />
                  {status.label}
                </Badge>
              </div>

              {/* Card Number */}
              <div className="space-y-1">
                <p className="text-xs text-white/60">{isRTL ? 'رقم البطاقة' : 'Card Number'}</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-mono tracking-[0.2em]">
                    {showSensitive && marqetaDetails?.pan
                      ? marqetaDetails.pan.replace(/(.{4})/g, '$1 ').trim()
                      : `•••• •••• •••• ${card.card_last_four || '****'}`}
                  </p>
                  <button onClick={() => setShowSensitive(!showSensitive)} className="text-white/60 hover:text-white transition-colors">
                    {showSensitive ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {showSensitive && marqetaDetails?.pan && (
                    <button onClick={() => copyToClipboard(marqetaDetails.pan, 'pan')} className="text-white/60 hover:text-white transition-colors">
                      {copiedField === 'pan' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Expiry & CVV */}
              <div className="flex gap-8">
                <div>
                  <p className="text-xs text-white/60">{isRTL ? 'تاريخ الانتهاء' : 'Expires'}</p>
                  <p className="font-mono text-lg">
                    {showSensitive && marqetaDetails?.expiration
                      ? marqetaDetails.expiration
                      : '••/••'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60">CVV</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-lg">
                      {showSensitive && marqetaDetails?.cvv_number
                        ? marqetaDetails.cvv_number
                        : '•••'}
                    </p>
                    {showSensitive && marqetaDetails?.cvv_number && (
                      <button onClick={() => copyToClipboard(marqetaDetails.cvv_number, 'cvv')} className="text-white/60 hover:text-white transition-colors">
                        {copiedField === 'cvv' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-3"
        >
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <DollarSign className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isRTL ? 'حد الإنفاق' : 'Limit'}</p>
            <p className="font-bold text-foreground text-sm">${card.spending_limit?.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <Hash className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isRTL ? 'العملة' : 'Currency'}</p>
            <p className="font-bold text-foreground text-sm">{card.currency}</p>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/60 p-3 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ الإنشاء' : 'Created'}</p>
            <p className="font-bold text-foreground text-sm">
              {format(new Date(card.created_at), 'dd/MM', { locale: isRTL ? ar : undefined })}
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        {card.card_status !== 'cancelled' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex gap-2"
          >
            {card.card_status === 'active' ? (
              <Button
                variant="outline"
                onClick={() => freezeCard(card.id)}
                disabled={actionLoading}
                className="flex-1 gap-2 h-12 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Snowflake className="w-4 h-4" />}
                {isRTL ? 'تجميد البطاقة' : 'Freeze Card'}
              </Button>
            ) : card.card_status === 'frozen' ? (
              <Button
                variant="outline"
                onClick={() => unfreezeCard(card.id)}
                disabled={actionLoading}
                className="flex-1 gap-2 h-12 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isRTL ? 'تفعيل البطاقة' : 'Activate Card'}
              </Button>
            ) : null}
            <Button
              variant="outline"
              onClick={() => cancelCard(card.id)}
              disabled={actionLoading}
              className="gap-2 h-12 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <X className="w-4 h-4" />
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
          </motion.div>
        )}

        {/* Security Info */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/40 bg-card/60 p-4 flex items-start gap-3"
        >
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-foreground text-sm">{isRTL ? 'بطاقة محمية' : 'Protected Card'}</h4>
            <p className="text-xs text-muted-foreground mt-1">
              {isRTL
                ? 'بطاقتك مؤمنة بتقنية Marqeta المتقدمة. يمكنك تجميدها أو إلغاؤها في أي وقت.'
                : 'Your card is secured with advanced Marqeta technology. You can freeze or cancel it anytime.'}
            </p>
          </div>
        </motion.div>

        <Separator />

        {/* Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground">{isRTL ? 'المعاملات الأخيرة' : 'Recent Transactions'}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                setTxLoading(true);
                const txData = await getTransactions(cardId!);
                if (txData) setTransactions(txData.transactions || []);
                setTxLoading(false);
              }}
              className="gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {isRTL ? 'تحديث' : 'Refresh'}
            </Button>
          </div>

          {txLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <Clock className="w-10 h-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">{isRTL ? 'لا توجد معاملات بعد' : 'No transactions yet'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx: any, index: number) => {
                const isCredit = tx.type === 'authorization.reversal' || tx.type === 'refund';
                return (
                  <motion.div
                    key={tx.token || index}
                    initial={{ opacity: 0, x: isRTL ? 15 : -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/30 bg-card/40"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isCredit ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      {isCredit
                        ? <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
                        : <ArrowUpRight className="w-5 h-5 text-red-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {tx.merchant?.name || tx.type || (isRTL ? 'معاملة' : 'Transaction')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.created_time
                          ? format(new Date(tx.created_time), 'dd/MM/yyyy HH:mm', { locale: isRTL ? ar : undefined })
                          : ''}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className={`font-bold text-sm ${isCredit ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCredit ? '+' : '-'}${Math.abs(tx.amount || 0).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{tx.currency_code || 'USD'}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default CardDetailsPage;
