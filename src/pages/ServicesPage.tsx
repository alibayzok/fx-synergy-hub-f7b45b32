import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogIn, Briefcase, Coins, ClipboardList } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { BrokerLandingSection } from '@/components/services/BrokerLandingSection';
import { UsdtServiceSection } from '@/components/services/UsdtServiceSection';
import { MyRequestsSection } from '@/components/services/MyRequestsSection';
import { cn } from '@/lib/utils';

type Tab = 'broker' | 'usdt' | 'requests';

const ServicesPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { requests, loading } = useServiceRequests();
  const [activeTab, setActiveTab] = useState<Tab>('broker');

  const { user, loading: authLoading } = useAuth();

  const handleRequestSubmitted = () => {
    setActiveTab('requests');
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
      </header>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Tab)} className="flex-1 flex flex-col">
        {/* Tabs List */}
        <div className="px-4 py-3 border-b border-border/30">
          <TabsList className="w-full grid grid-cols-3 h-11">
            <TabsTrigger value="broker" className="gap-2 text-xs sm:text-sm">
              <Briefcase className="w-4 h-4" />
              <span className="hidden sm:inline">{t('services.brokerTab')}</span>
              <span className="sm:hidden">{t('services.broker')}</span>
            </TabsTrigger>
            <TabsTrigger value="usdt" className="gap-2 text-xs sm:text-sm">
              <Coins className="w-4 h-4" />
              <span>USDT</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2 text-xs sm:text-sm relative">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">{t('services.myRequests')}</span>
              <span className="sm:hidden">{t('services.requests')}</span>
              {requests.length > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-auto px-4 py-4">
          <TabsContent value="broker" className="mt-0 h-full">
            <BrokerLandingSection onRequestSubmitted={handleRequestSubmitted} />
          </TabsContent>

          <TabsContent value="usdt" className="mt-0 h-full">
            <UsdtServiceSection onRequestSubmitted={handleRequestSubmitted} />
          </TabsContent>

          <TabsContent value="requests" className="mt-0 h-full">
            <MyRequestsSection requests={requests} loading={loading} />
          </TabsContent>
        </div>
      </Tabs>
    </AppLayout>
  );
};

export default ServicesPage;
