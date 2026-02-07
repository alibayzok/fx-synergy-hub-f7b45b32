import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, LogIn, Send, Briefcase, UserPlus } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ServiceCard } from '@/components/services/ServiceCard';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useServiceRequests, ServiceStatus, ServiceType } from '@/hooks/useServiceRequests';
import { useToast } from '@/hooks/use-toast';

type Tab = 'services' | 'requests';

const statusConfig: Record<ServiceStatus, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400' },
  in_progress: { icon: AlertCircle, color: 'text-blue-400' },
  approved: { icon: CheckCircle, color: 'text-profit' },
  rejected: { icon: XCircle, color: 'text-loss' },
  completed: { icon: CheckCircle, color: 'text-profit' },
};

const ServicesPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { requests, loading, createRequest } = useServiceRequests();
  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [showBrokerAccountDialog, setShowBrokerAccountDialog] = useState(false);
  const [selectedService, setSelectedService] = useState<'broker' | 'usdt' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    type: '' as ServiceType | '',
    amount: '',
    network: 'TRC20',
    notes: ''
  });

  const { user, loading: authLoading } = useAuth();
  const isArabic = i18n.language === 'ar';

  const handleServiceClick = (type: 'broker' | 'usdt') => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setSelectedService(type);
    setFormData(prev => ({
      ...prev,
      type: type === 'broker' ? 'broker_deposit' : 'usdt_buy'
    }));
    setShowServiceDialog(true);
  };

  const handleBrokerAccountClick = () => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setShowBrokerAccountDialog(true);
  };

  const handleSubmitRequest = async () => {
    if (!formData.type || (formData.type !== 'broker_account' && !formData.amount)) {
      toast({
        title: t('common.error'),
        description: t('services.fillAllFields'),
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    const result = await createRequest({
      type: formData.type as ServiceType,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      network: formData.type.includes('usdt') ? formData.network : undefined,
      notes: formData.notes || undefined,
    });

    setSubmitting(false);

    if (result) {
      setShowServiceDialog(false);
      setFormData({ type: '', amount: '', network: 'TRC20', notes: '' });
      setActiveTab('requests');
    }
  };

  const handleSubmitBrokerAccount = async () => {
    setSubmitting(true);
    const result = await createRequest({
      type: 'broker_account',
      notes: formData.notes || undefined,
    });

    setSubmitting(false);

    if (result) {
      setShowBrokerAccountDialog(false);
      setFormData({ type: '', amount: '', network: 'TRC20', notes: '' });
      setActiveTab('requests');
    }
  };

  // Show login prompt if not authenticated
  if (!authLoading && !user) {
    return (
      <AppLayout>
        <header className="sticky top-0 z-40 glass-card border-b border-border/30">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold text-foreground">{t('services.title')}</h1>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <LogIn className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">{t('auth.login')}</h2>
            <p className="text-muted-foreground">{t('auth.loginPrompt')}</p>
          </div>
          <Button onClick={() => navigate('/auth')} className="gap-2">
            <LogIn className="w-4 h-4" />
            {t('auth.login')}
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('services.title')}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {(['services', 'requests'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-colors",
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {tab === 'services' ? t('services.title') : t('services.myRequests')}
              {tab === 'requests' && requests.length > 0 && (
                <span className="ms-2 px-1.5 py-0.5 rounded-full bg-primary-foreground/20 text-xs">
                  {requests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {activeTab === 'services' ? (
          <div className="space-y-4">
            {/* Open Trading Account Card */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBrokerAccountClick}
              className="w-full flex items-center gap-4 p-4 rounded-xl border text-start transition-all bg-gradient-to-r from-amber-500/20 to-orange-500/10 border-amber-500/30 hover:opacity-90"
            >
              <div className="flex-shrink-0 p-3 rounded-lg bg-card/50">
                <UserPlus className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-0.5">{t('services.openBrokerAccount')}</h4>
                <p className="text-sm text-muted-foreground">{t('services.openBrokerAccountDesc')}</p>
              </div>
            </motion.button>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ServiceCard type="broker" onClick={() => handleServiceClick('broker')} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <ServiceCard type="usdt" onClick={() => handleServiceClick('usdt')} />
            </motion.div>

            {/* Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/30"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {t('services.broker')}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  {t('services.deposit')} / {t('services.withdraw')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  OneRoyal Partner Benefits
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-4 rounded-xl bg-muted/30 border border-border/30"
            >
              <h3 className="font-semibold text-foreground mb-2">
                {t('services.usdt')}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  {t('services.usdtBuy')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  {t('services.usdtSell')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  TRC20 / ERC20 / BEP20
                </li>
              </ul>
            </motion.div>
          </div>
        ) : (
          <div className="space-y-3">
            {loading ? (
              <div className="flex justify-center py-12">
                <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            ) : requests.length > 0 ? (
              requests.map((request, index) => {
                const config = statusConfig[request.status];
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 rounded-xl bg-card/50 border border-border/30"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Badge variant="outline" className="mb-2">
                          {t(`services.${request.type}`)}
                        </Badge>
                        {request.amount && (
                          <p className="text-sm text-muted-foreground">
                            {t('services.amount')}: <span className="trading-number font-medium text-foreground">${request.amount}</span>
                          </p>
                        )}
                        {request.network && (
                          <p className="text-sm text-muted-foreground">
                            {t('services.network')}: <span className="text-foreground">{request.network}</span>
                          </p>
                        )}
                        {request.admin_notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {t('services.adminNotes')}: <span className="text-foreground">{request.admin_notes}</span>
                          </p>
                        )}
                      </div>
                      <div className={cn("flex items-center gap-1", config.color)}>
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {t(`services.${request.status}`)}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">{t('services.noRequests')}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Service Request Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {selectedService === 'broker' 
                ? t('services.brokerRequest') 
                : t('services.usdtRequest')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('services.requestType')}</label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as ServiceType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('services.selectType')} />
                </SelectTrigger>
                <SelectContent>
                  {selectedService === 'broker' ? (
                    <>
                      <SelectItem value="broker_deposit">{t('services.deposit')}</SelectItem>
                      <SelectItem value="broker_withdraw">{t('services.withdraw')}</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="usdt_buy">{t('services.usdtBuy')}</SelectItem>
                      <SelectItem value="usdt_sell">{t('services.usdtSell')}</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('services.amount')} (USD)</label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="trading-number"
              />
            </div>

            {selectedService === 'usdt' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('services.network')}</label>
                <Select
                  value={formData.network}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, network: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                    <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                    <SelectItem value="BEP20">BEP20 (BSC)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('services.notes')}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('services.notesPlaceholder')}
                rows={3}
              />
            </div>

            <Button onClick={handleSubmitRequest} className="w-full gap-2" disabled={submitting}>
              <Send className="w-4 h-4" />
              {submitting ? t('common.loading') : t('services.submitRequest')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Broker Account Dialog */}
      <Dialog open={showBrokerAccountDialog} onOpenChange={setShowBrokerAccountDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t('services.openBrokerAccount')}</DialogTitle>
            <DialogDescription>{t('services.openBrokerAccountDesc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-4 rounded-lg bg-muted/30 border border-border/30">
              <div className="flex items-center gap-3 mb-3">
                <Briefcase className="w-8 h-8 text-amber-400" />
                <div>
                  <h4 className="font-semibold">OneRoyal</h4>
                  <p className="text-sm text-muted-foreground">Official Partner</p>
                </div>
              </div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  {t('services.brokerBenefit1')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  {t('services.brokerBenefit2')}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-profit" />
                  {t('services.brokerBenefit3')}
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('services.notes')}</label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('services.brokerNotesPlaceholder')}
                rows={3}
              />
            </div>

            <Button onClick={handleSubmitBrokerAccount} className="w-full gap-2" disabled={submitting}>
              <Send className="w-4 h-4" />
              {submitting ? t('common.loading') : t('services.submitRequest')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ServicesPage;
