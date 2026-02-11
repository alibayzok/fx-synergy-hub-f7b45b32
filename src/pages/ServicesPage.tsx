import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { LogIn, Briefcase, ClipboardList, ExternalLink, CheckCircle, Star, ChevronRight, Loader2, Coins, CreditCard } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useServiceRequests } from '@/hooks/useServiceRequests';
import { MyRequestsSection } from '@/components/services/MyRequestsSection';
import { UsdtServiceSection } from '@/components/services/UsdtServiceSection';
import VirtualCardsSection from '@/components/services/VirtualCardsSection';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Service {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  color: string;
  link_url: string;
  link_label_ar: string;
  link_label_en: string;
  is_active: boolean;
  is_external_link: boolean;
  sort_order: number;
}

interface BrokerStat {
  label_ar: string;
  label_en: string;
  value: string;
}

interface Broker {
  id: string;
  name: string;
  name_ar: string;
  logo_url: string;
  registration_url: string;
  description_ar: string;
  description_en: string;
  features_ar: string[];
  features_en: string[];
  stats: BrokerStat[];
  color: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const ServicesPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';
  const { requests, loading: reqLoading } = useServiceRequests();
  const { user, loading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('main');

  useEffect(() => {
    const fetchData = async () => {
      const [sRes, bRes] = await Promise.all([
        supabase.from('services').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('brokers').select('*').eq('is_active', true).order('sort_order'),
      ]);
      if (sRes.data) setServices(sRes.data as any);
      if (bRes.data) setBrokers(bRes.data.map((b: any) => ({ ...b, stats: b.stats || [] })) as any);
      setLoading(false);
    };
    fetchData();
  }, []);

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
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold text-foreground">{t('services.title')}</h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-border/30">
          <TabsList className="w-full grid grid-cols-5 h-11">
            <TabsTrigger value="main" className="gap-1 text-[10px] sm:text-sm px-1">
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isRTL ? 'الخدمات' : 'Services'}</span>
              <span className="sm:hidden">{isRTL ? 'خدمات' : 'Svc'}</span>
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-1 text-[10px] sm:text-sm px-1">
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isRTL ? 'البطاقات' : 'Cards'}</span>
              <span className="sm:hidden">{isRTL ? 'بطاقات' : 'Cards'}</span>
            </TabsTrigger>
            <TabsTrigger value="usdt" className="gap-1 text-[10px] sm:text-sm px-1">
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              USDT
            </TabsTrigger>
            <TabsTrigger value="brokers" className="gap-1 text-[10px] sm:text-sm px-1">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{isRTL ? 'البروكرات' : 'Brokers'}</span>
              <span className="sm:hidden">{isRTL ? 'بروكر' : 'Brkr'}</span>
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1 text-[10px] sm:text-sm px-1 relative">
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t('services.myRequests')}</span>
              <span className="sm:hidden">{isRTL ? 'طلبات' : 'Req'}</span>
              {requests.length > 0 && (
                <span className="absolute -top-1 -end-1 w-5 h-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {requests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4">
          {/* Services Tab */}
          <TabsContent value="main" className="mt-0 space-y-4">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : services.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {isRTL ? 'لا توجد خدمات متاحة حالياً' : 'No services available'}
              </div>
            ) : (
              services.map((service, index) => {
                const isUsdt = service.icon === 'Coins' || service.name_en?.toLowerCase().includes('usdt');

                if (isUsdt) {
                  return (
                    <motion.div
                      key={service.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setActiveTab('usdt')}
                      className="relative cursor-pointer rounded-2xl overflow-hidden border border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-teal-500/8 to-transparent hover:border-emerald-400/50 transition-all group"
                    >
                      {/* Decorative glow */}
                      <div className="absolute top-0 end-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 start-0 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

                      <div className="relative p-5 space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-shadow">
                            <Coins className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-foreground">{isRTL ? service.name_ar : (service.name_en || service.name_ar)}</h3>
                              <Badge className="text-[10px] bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                {isRTL ? 'متاح' : 'Live'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? service.description_ar : (service.description_en || service.description_ar)}
                            </p>
                          </div>
                        </div>

                        {/* Quick stats row */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="text-center p-2.5 rounded-xl bg-card/40 border border-border/20">
                            <div className="text-xs text-emerald-400 font-bold">{isRTL ? 'شراء' : 'Buy'}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'بأفضل سعر' : 'Best price'}</div>
                          </div>
                          <div className="text-center p-2.5 rounded-xl bg-card/40 border border-border/20">
                            <div className="text-xs text-red-400 font-bold">{isRTL ? 'بيع' : 'Sell'}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'سعر تنافسي' : 'Competitive'}</div>
                          </div>
                          <div className="text-center p-2.5 rounded-xl bg-card/40 border border-border/20">
                            <div className="text-xs text-primary font-bold">{isRTL ? 'آمن' : 'Secure'}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5">{isRTL ? 'تحويل فوري' : 'Instant'}</div>
                          </div>
                        </div>

                        <Button
                          className="w-full h-11 gap-2 text-white font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20"
                        >
                          <Coins className="w-4 h-4" />
                          {isRTL ? 'ابدأ التداول الآن' : 'Start Trading Now'}
                          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                }

                return (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-2xl border border-border/40 bg-card/60 overflow-hidden hover:border-primary/30 transition-all"
                  >
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold shadow-lg"
                          style={{ backgroundColor: service.color }}>
                          {service.icon.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-foreground">{isRTL ? service.name_ar : (service.name_en || service.name_ar)}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {isRTL ? service.description_ar : (service.description_en || service.description_ar)}
                          </p>
                        </div>
                      </div>
                      {service.link_url && (
                        <Button
                          onClick={() => {
                            if (service.is_external_link) {
                              window.open(service.link_url, '_blank', 'noopener,noreferrer');
                            } else {
                              navigate(service.link_url);
                            }
                          }}
                          className="w-full gap-2"
                          style={{ backgroundColor: service.color }}
                        >
                          {service.is_external_link && <ExternalLink className="w-4 h-4" />}
                          {isRTL ? service.link_label_ar : (service.link_label_en || service.link_label_ar)}
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </TabsContent>

          {/* Virtual Cards Tab */}
          <TabsContent value="cards" className="mt-0">
            <VirtualCardsSection />
          </TabsContent>

          {/* USDT Tab */}
          <TabsContent value="usdt" className="mt-0">
            <UsdtServiceSection onRequestSubmitted={() => setActiveTab('requests')} />
          </TabsContent>

          {/* Brokers Tab */}
          <TabsContent value="brokers" className="mt-0 space-y-6">
            {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : brokers.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                {isRTL ? 'لا توجد بروكرات متاحة حالياً' : 'No brokers available'}
              </div>
            ) : (
              brokers.map((broker, index) => (
                <motion.div
                  key={broker.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.15 }}
                  className="relative overflow-hidden rounded-2xl border border-border/40 bg-card/60"
                >
                  {/* Broker Header */}
                  <div className="p-5 space-y-4" style={{ background: `linear-gradient(135deg, ${broker.color}15, transparent)` }}>
                    <div className="flex items-center gap-3">
                      {broker.logo_url ? (
                        <img src={broker.logo_url} alt={broker.name} className="w-14 h-14 rounded-xl object-contain bg-white p-1.5 shadow-md" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg"
                          style={{ backgroundColor: broker.color }}>
                          {broker.name.substring(0, 2)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                          {broker.name}
                          {broker.is_featured && (
                            <Badge className="text-[10px] bg-amber-500/20 text-amber-500 border-amber-500/30">
                              <Star className="w-3 h-3 fill-amber-400 mr-1" />
                              {isRTL ? 'مميز' : 'Featured'}
                            </Badge>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? broker.description_ar : (broker.description_en || broker.description_ar)}
                        </p>
                      </div>
                    </div>

                    {/* Stats */}
                    {broker.stats && broker.stats.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {broker.stats.map((stat, i) => (
                          <div key={i} className="text-center p-2.5 rounded-xl bg-card/60 border border-border/30">
                            <div className="text-sm font-bold text-foreground trading-number">{stat.value}</div>
                            <div className="text-[10px] text-muted-foreground leading-tight">
                              {isRTL ? stat.label_ar : (stat.label_en || stat.label_ar)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Features */}
                    {((isRTL ? broker.features_ar : broker.features_en) || broker.features_ar || []).length > 0 && (
                      <div className="space-y-1.5">
                        {((isRTL ? broker.features_ar : broker.features_en) || broker.features_ar).map((feat, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-foreground">{feat}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* CTA */}
                    <Button
                      onClick={() => window.open(broker.registration_url, '_blank', 'noopener,noreferrer')}
                      className="w-full h-12 text-base font-bold text-white shadow-lg gap-2"
                      style={{ background: `linear-gradient(135deg, ${broker.color}, ${broker.color}cc)` }}
                    >
                      <ExternalLink className="w-5 h-5" />
                      {isRTL ? 'فتح حساب' : 'Open Account'}
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="mt-0 h-full">
            <MyRequestsSection requests={requests} loading={reqLoading} />
          </TabsContent>
        </div>
      </Tabs>
    </AppLayout>
  );
};

export default ServicesPage;
