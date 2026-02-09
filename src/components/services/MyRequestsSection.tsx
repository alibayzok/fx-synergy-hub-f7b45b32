import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle, Wallet, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ServiceRequest, ServiceStatus } from '@/hooks/useServiceRequests';
import { cn } from '@/lib/utils';

interface MyRequestsSectionProps {
  requests: ServiceRequest[];
  loading: boolean;
}

const statusConfig: Record<ServiceStatus, { icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  in_progress: { icon: AlertCircle, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  approved: { icon: CheckCircle, color: 'text-profit', bgColor: 'bg-profit/10' },
  rejected: { icon: XCircle, color: 'text-loss', bgColor: 'bg-loss/10' },
  completed: { icon: CheckCircle, color: 'text-profit', bgColor: 'bg-profit/10' },
};

const typeIcons: Record<string, typeof Wallet> = {
  broker_deposit: Wallet,
  broker_withdraw: Wallet,
  broker_account: CreditCard,
  usdt_buy: Wallet,
  usdt_sell: Wallet,
};

export const MyRequestsSection = ({ requests, loading }: MyRequestsSectionProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Clock className="w-8 h-8 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground">{t('services.noRequests')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((request, index) => {
        const config = statusConfig[request.status];
        const Icon = config.icon;
        const TypeIcon = typeIcons[request.type] || Wallet;
        
        return (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-xl bg-card/50 border border-border/30"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", config.bgColor)}>
                  <TypeIcon className={cn("w-5 h-5", config.color)} />
                </div>
                <div>
                  <Badge variant="outline" className="mb-1">
                    {t(`services.${request.type}`)}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {new Date(request.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              
              <div className={cn("flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", config.bgColor, config.color)}>
                <Icon className="w-3 h-3" />
                {t(`services.${request.status}`)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              {request.amount && (
                <div>
                  <span className="text-muted-foreground">{t('services.amount')}:</span>
                  <span className="trading-number font-medium text-foreground ms-1">
                    ${request.amount.toLocaleString('en-US')}
                  </span>
                </div>
              )}
              {request.network && (
                <div>
                  <span className="text-muted-foreground">{t('services.network')}:</span>
                  <span className="text-foreground ms-1">{request.network}</span>
                </div>
              )}
            </div>

            {request.admin_notes && (
              <div className="mt-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                <p className="text-xs text-muted-foreground mb-1">{t('services.adminNotes')}:</p>
                <p className="text-sm text-foreground">{request.admin_notes}</p>
              </div>
            )}

            {request.notes && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">{t('services.notes')}:</span> {request.notes}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
