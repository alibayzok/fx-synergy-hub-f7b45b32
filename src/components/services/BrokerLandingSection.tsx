import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Gauge, 
  Monitor, 
  Headphones, 
  Gift, 
  Zap, 
  Star, 
  Globe, 
  Shield,
  ArrowUpCircle,
  ArrowDownCircle,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BrokerRequestDialog } from './BrokerRequestDialog';

interface BrokerLandingSectionProps {
  onRequestSubmitted: () => void;
}

export const BrokerLandingSection = ({ onRequestSubmitted }: BrokerLandingSectionProps) => {
  const { t } = useTranslation();
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showDepositDialog, setShowDepositDialog] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  const stats = [
    { icon: TrendingUp, label: t('services.brokerLanding.lowSpread'), value: '0.0', color: 'text-profit' },
    { icon: Gauge, label: t('services.brokerLanding.leverage'), value: '1:500', color: 'text-primary' },
    { icon: Monitor, label: t('services.brokerLanding.platforms'), value: 'MT4/MT5', color: 'text-blue-400' },
    { icon: Headphones, label: t('services.brokerLanding.support'), value: '24/7', color: 'text-amber-400' },
  ];

  const benefits = [
    { icon: Gift, text: t('services.brokerLanding.features.bonus') },
    { icon: Zap, text: t('services.brokerLanding.features.fastWithdraw') },
    { icon: Star, text: t('services.brokerLanding.features.islamic') },
    { icon: Globe, text: t('services.brokerLanding.features.arabicSupport') },
    { icon: Shield, text: t('services.brokerLanding.features.execution') },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-background p-6 border border-amber-500/30"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 start-0 w-32 h-32 bg-amber-500 rounded-full blur-3xl" />
          <div className="absolute bottom-0 end-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo & Title */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/30">
              <span className="text-2xl font-bold text-white">OR</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-1">
              {t('services.brokerLanding.title')}
            </h2>
            <p className="text-muted-foreground">
              {t('services.brokerLanding.subtitle')}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-3 rounded-xl bg-card/50 border border-border/30"
              >
                <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                <div className="text-sm font-bold text-foreground trading-number">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground leading-tight">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Benefits List */}
          <div className="space-y-2 mb-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
                className="flex items-center gap-3 text-sm"
              >
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-profit/20 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-profit" />
                </div>
                <span className="text-foreground">{benefit.text}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              onClick={() => setShowAccountDialog(true)}
              className="w-full h-12 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
            >
              <UserPlus className="w-5 h-5 me-2" />
              {t('services.brokerLanding.openAccount')}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card 
            className="cursor-pointer hover:border-profit/50 transition-colors border-border/50 bg-card/50"
            onClick={() => setShowDepositDialog(true)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-profit/20 flex items-center justify-center mx-auto mb-3">
                <ArrowDownCircle className="w-6 h-6 text-profit" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('services.deposit')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('services.brokerLanding.depositDesc')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card 
            className="cursor-pointer hover:border-loss/50 transition-colors border-border/50 bg-card/50"
            onClick={() => setShowWithdrawDialog(true)}
          >
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-loss/20 flex items-center justify-center mx-auto mb-3">
                <ArrowUpCircle className="w-6 h-6 text-loss" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">
                {t('services.withdraw')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('services.brokerLanding.withdrawDesc')}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Partner Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="p-4 rounded-xl bg-muted/30 border border-border/30 text-center"
      >
        <p className="text-sm text-muted-foreground">
          {t('services.brokerLanding.partnerNote')}
        </p>
      </motion.div>

      {/* Dialogs */}
      <BrokerRequestDialog
        open={showAccountDialog}
        onOpenChange={setShowAccountDialog}
        type="broker_account"
        onSuccess={onRequestSubmitted}
      />
      <BrokerRequestDialog
        open={showDepositDialog}
        onOpenChange={setShowDepositDialog}
        type="broker_deposit"
        onSuccess={onRequestSubmitted}
      />
      <BrokerRequestDialog
        open={showWithdrawDialog}
        onOpenChange={setShowWithdrawDialog}
        type="broker_withdraw"
        onSuccess={onRequestSubmitted}
      />
    </div>
  );
};
