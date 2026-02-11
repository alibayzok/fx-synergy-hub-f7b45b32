import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Plus, Snowflake, Play, X, Eye, EyeOff, Loader2, Receipt, ChevronRight, Wallet, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useVirtualCards } from '@/hooks/useVirtualCards';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';

const VirtualCardsSection = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { cards, loading, actionLoading, createCard, freezeCard, unfreezeCard, cancelCard, requestFundCard } = useVirtualCards();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showFundDialog, setShowFundDialog] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [spendingLimit, setSpendingLimit] = useState('1000');
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  const handleCreate = async () => {
    try {
      await createCard({
        nickname: nickname || undefined,
        spending_limit: parseFloat(spendingLimit) || 1000,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        email: user?.email || undefined,
      });
      setShowCreateDialog(false);
      setNickname('');
      setSpendingLimit('1000');
    } catch {}
  };

  const handleFundCard = async () => {
    if (!selectedCardId || !fundAmount) return;
    try {
      await requestFundCard(selectedCardId, parseFloat(fundAmount), walletAddress || undefined);
      setShowFundDialog(false);
      setFundAmount('');
      setWalletAddress('');
      setSelectedCardId(null);
    } catch {}
  };

  const openFundDialog = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCardId(cardId);
    setShowFundDialog(true);
  };

  const toggleReveal = (cardId: string) => {
    setRevealedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">{isRTL ? 'نشطة' : 'Active'}</Badge>;
      case 'frozen':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">{isRTL ? 'مجمدة' : 'Frozen'}</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{isRTL ? 'ملغاة' : 'Cancelled'}</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{isRTL ? 'معلقة' : 'Pending'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{isRTL ? 'بطاقاتي الافتراضية' : 'My Virtual Cards'}</h2>
          <p className="text-sm text-muted-foreground">{isRTL ? 'إنشاء وإدارة بطاقات الدفع' : 'Create and manage payment cards'}</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              {isRTL ? 'بطاقة جديدة' : 'New Card'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء بطاقة افتراضية' : 'Create Virtual Card'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'اسم البطاقة (اختياري)' : 'Card Nickname (optional)'}</Label>
                <Input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder={isRTL ? 'مثال: بطاقة التسوق' : 'e.g. Shopping Card'}
                />
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'حد الإنفاق ($)' : 'Spending Limit ($)'}</Label>
                <Input
                  type="number"
                  value={spendingLimit}
                  onChange={e => setSpendingLimit(e.target.value)}
                  min="10"
                  max="50000"
                />
              </div>
              <Button onClick={handleCreate} disabled={actionLoading} className="w-full gap-2">
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {isRTL ? 'إنشاء البطاقة' : 'Create Card'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fund Card Dialog */}
        <Dialog open={showFundDialog} onOpenChange={setShowFundDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                {isRTL ? 'شحن البطاقة عبر USDT' : 'Fund Card via USDT'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-foreground">
                <p className="font-medium mb-1">{isRTL ? 'كيف تتم العملية؟' : 'How it works?'}</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  <li>{isRTL ? 'أدخل المبلغ وعنوان محفظة USDT' : 'Enter amount and USDT wallet address'}</li>
                  <li>{isRTL ? 'أرسل USDT إلى عنوان الإدارة' : 'Send USDT to admin address'}</li>
                  <li>{isRTL ? 'بعد تأكيد الإدارة، يتم شحن البطاقة تلقائياً' : 'After admin confirms, card is funded automatically'}</li>
                </ol>
              </div>
              
              <div className="space-y-2">
                <Label>{isRTL ? 'المبلغ (USD)' : 'Amount (USD)'}</Label>
                <Input
                  type="number"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  placeholder={isRTL ? 'مثال: 100' : 'e.g. 100'}
                  min="10"
                  max="50000"
                />
              </div>
              
              <div className="space-y-2">
                <Label>{isRTL ? 'عنوان محفظة USDT (TRC20/ERC20)' : 'USDT Wallet Address (TRC20/ERC20)'}</Label>
                <Input
                  value={walletAddress}
                  onChange={e => setWalletAddress(e.target.value)}
                  placeholder={isRTL ? 'عنوان المحفظة التي أرسلت منها' : 'Wallet address you sent from'}
                  dir="ltr"
                />
              </div>
              
              <Button 
                onClick={handleFundCard} 
                disabled={actionLoading || !fundAmount || parseFloat(fundAmount) < 10} 
                className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                {isRTL ? 'إرسال طلب الشحن' : 'Submit Funding Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards List */}
      {cards.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 space-y-4"
        >
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CreditCard className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{isRTL ? 'لا توجد بطاقات بعد' : 'No cards yet'}</h3>
            <p className="text-sm text-muted-foreground">{isRTL ? 'أنشئ بطاقتك الافتراضية الأولى' : 'Create your first virtual card'}</p>
          </div>
        </motion.div>
      ) : (
        <AnimatePresence>
          {cards.map((card, index) => {
            const isRevealed = revealedCards.has(card.id);
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ delay: index * 0.08 }}
                className="relative overflow-hidden rounded-2xl border border-border/40 cursor-pointer"
                onClick={() => navigate(`/card/${card.id}`)}
              >
                {/* Card Visual */}
                <div className="relative p-5 bg-gradient-to-br from-violet-600/20 via-purple-500/10 to-indigo-600/15">
                  <div className="absolute top-0 end-0 w-32 h-32 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative space-y-4">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-violet-400" />
                        <span className="text-sm font-medium text-foreground">{card.nickname || (isRTL ? 'بطاقة افتراضية' : 'Virtual Card')}</span>
                      </div>
                      {getStatusBadge(card.card_status)}
                    </div>

                    {/* Card Number */}
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-mono tracking-widest text-foreground/80">
                        {isRevealed
                          ? `•••• •••• •••• ${card.card_last_four || '****'}`
                          : '•••• •••• •••• ••••'}
                      </p>
                      <button onClick={() => toggleReveal(card.id)} className="text-muted-foreground hover:text-foreground transition-colors">
                        {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-muted-foreground text-xs">{isRTL ? 'حد الإنفاق' : 'Limit'}</span>
                        <p className="font-bold text-foreground">${card.spending_limit?.toLocaleString()}</p>
                      </div>
                      <div className="text-end">
                        <span className="text-muted-foreground text-xs">{isRTL ? 'العملة' : 'Currency'}</span>
                        <p className="font-bold text-foreground">{card.currency}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2">
                      {card.card_status !== 'cancelled' && (
                        <div className="flex gap-2 flex-wrap">
                          {/* Fund Card Button */}
                          {card.card_status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => openFundDialog(card.id, e)}
                              disabled={actionLoading}
                              className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Wallet className="w-3.5 h-3.5" />
                              {isRTL ? 'شحن' : 'Fund'}
                            </Button>
                          )}
                          {card.card_status === 'active' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); freezeCard(card.id); }}
                              disabled={actionLoading}
                              className="gap-1.5 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                            >
                              <Snowflake className="w-3.5 h-3.5" />
                              {isRTL ? 'تجميد' : 'Freeze'}
                            </Button>
                          ) : card.card_status === 'frozen' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); unfreezeCard(card.id); }}
                              disabled={actionLoading}
                              className="gap-1.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            >
                              <Play className="w-3.5 h-3.5" />
                              {isRTL ? 'تفعيل' : 'Activate'}
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); cancelCard(card.id); }}
                            disabled={actionLoading}
                            className="gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <X className="w-3.5 h-3.5" />
                            {isRTL ? 'إلغاء' : 'Cancel'}
                          </Button>
                        </div>
                      )}
                      <ChevronRight className="w-5 h-5 text-muted-foreground rtl:rotate-180" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
};

export default VirtualCardsSection;
