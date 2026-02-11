import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { SubscriptionsManagement } from '@/components/admin/SubscriptionsManagement';

const SubscriptionsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAdmin, loading: authLoading } = useAuth();
  const isRTL = i18n.language === 'ar';

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/');
  }, [isAdmin, authLoading, navigate]);

  if (authLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold text-foreground">
                {isRTL ? 'إدارة الاشتراكات' : 'Subscription Management'}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="p-4 max-w-6xl mx-auto">
        <SubscriptionsManagement />
      </div>
    </div>
  );
};

export default SubscriptionsPage;
