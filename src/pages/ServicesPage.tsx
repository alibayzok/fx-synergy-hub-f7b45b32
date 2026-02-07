import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ServiceCard } from '@/components/services/ServiceCard';
import { mockServiceRequests } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ServiceStatus } from '@/types';

type Tab = 'services' | 'requests';

const statusConfig: Record<ServiceStatus, { icon: typeof Clock; color: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400' },
  in_progress: { icon: AlertCircle, color: 'text-blue-400' },
  approved: { icon: CheckCircle, color: 'text-profit' },
  rejected: { icon: XCircle, color: 'text-loss' },
  completed: { icon: CheckCircle, color: 'text-profit' },
};

const ServicesPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('services');

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
            </button>
          ))}
        </div>
      </header>

      <div className="px-4 py-4">
        {activeTab === 'services' ? (
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ServiceCard type="broker" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <ServiceCard type="usdt" />
            </motion.div>

            {/* Info Cards */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
          </div>
        ) : (
          <div className="space-y-3">
            {mockServiceRequests.length > 0 ? (
              mockServiceRequests.map((request, index) => {
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
                          {request.type.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <p className="text-sm text-muted-foreground">
                          {t('services.amount')}: <span className="trading-number font-medium text-foreground">${request.amount}</span>
                        </p>
                        {request.network && (
                          <p className="text-sm text-muted-foreground">
                            {t('services.network')}: <span className="text-foreground">{request.network}</span>
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
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-muted-foreground">No requests yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ServicesPage;
