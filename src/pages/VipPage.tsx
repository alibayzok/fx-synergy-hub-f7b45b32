import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, Check, Star, Radio, BookOpen, Shield, Zap, 
  ArrowLeft, Sparkles, Lock, TrendingUp, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';

const VipPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isVip, isAdmin } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [requesting, setRequesting] = useState(false);
  const isRTL = i18n.language === 'ar';

  const plans = [
    {
      id: 'monthly' as const,
      name: isRTL ? 'شهري' : 'Monthly',
      price: '$29',
      period: isRTL ? '/شهر' : '/month',
      savings: null,
    },
    {
      id: 'yearly' as const,
      name: isRTL ? 'سنوي' : 'Yearly',
      price: '$199',
      period: isRTL ? '/سنة' : '/year',
      savings: isRTL ? 'وفر 43%' : 'Save 43%',
    },
  ];

  const features = [
    { icon: Radio, text: isRTL ? 'إشارات تداول VIP حصرية' : 'Exclusive VIP trading signals', color: 'text-amber-400' },
    { icon: TrendingUp, text: isRTL ? 'تحليلات متقدمة واحترافية' : 'Advanced professional analyses', color: 'text-profit' },
    { icon: BookOpen, text: isRTL ? 'كورسات تعليمية متقدمة' : 'Advanced learning courses', color: 'text-blue-400' },
    { icon: Users, text: isRTL ? 'غرف مجتمع VIP خاصة' : 'Private VIP community rooms', color: 'text-purple-400' },
    { icon: Zap, text: isRTL ? 'أولوية في الدعم الفني' : 'Priority technical support', color: 'text-orange-400' },
    { icon: Shield, text: isRTL ? 'وصول مبكر للميزات الجديدة' : 'Early access to new features', color: 'text-primary' },
  ];

  const handleRequestVip = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setRequesting(true);
    try {
      // Create admin notification for VIP request
      const { error } = await supabase
        .from('admin_notifications')
        .insert({
          type: 'vip_request',
          title: 'طلب اشتراك VIP 👑',
          message: `طلب اشتراك VIP - باقة ${selectedPlan === 'monthly' ? 'شهرية' : 'سنوية'}`,
          data: {
            user_id: user.id,
            plan: selectedPlan,
            email: user.email,
          },
        });

      if (error) throw error;

      toast({
        title: isRTL ? 'تم إرسال طلبك بنجاح! ✅' : 'Request sent successfully! ✅',
        description: isRTL 
          ? 'سيتم التواصل معك قريباً لإتمام عملية الاشتراك'
          : 'We will contact you soon to complete the subscription',
      });
    } catch (err: any) {
      toast({
        title: isRTL ? 'حدث خطأ' : 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setRequesting(false);
    }
  };

  // Already VIP
  if (isVip || isAdmin) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-6 max-w-sm"
          >
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/30">
              <Crown className="w-12 h-12 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {isRTL ? 'أنت عضو VIP! 🎉' : 'You are VIP! 🎉'}
              </h2>
              <p className="text-muted-foreground mt-2">
                {isRTL ? 'تمتع بجميع المزايا الحصرية' : 'Enjoy all exclusive benefits'}
              </p>
            </div>
            <Button onClick={() => navigate('/')} className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              {isRTL ? 'العودة للرئيسية' : 'Go Home'}
            </Button>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-40 glass-card border-b border-border/30">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
            </Button>
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <h1 className="text-xl font-bold">{isRTL ? 'اشتراك VIP' : 'VIP Subscription'}</h1>
            </div>
          </div>
        </header>

        <div className="p-4 space-y-6 max-w-lg mx-auto">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, hsl(38 100% 20%), hsl(25 80% 15%), hsl(280 30% 12%))',
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-4 start-4 w-24 h-24 bg-amber-400 rounded-full blur-3xl" />
              <div className="absolute bottom-4 end-4 w-32 h-32 bg-orange-500 rounded-full blur-3xl" />
              <div className="absolute top-1/2 start-1/2 w-20 h-20 bg-yellow-400 rounded-full blur-2xl" />
            </div>

            <div className="relative z-10 space-y-4">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-2xl shadow-amber-500/40"
              >
                <Crown className="w-10 h-10 text-white" />
              </motion.div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  {isRTL ? 'انضم لنخبة المتداولين' : 'Join Elite Traders'}
                </h2>
                <p className="text-white/70 mt-2 text-sm">
                  {isRTL 
                    ? 'احصل على إشارات حصرية وتحليلات احترافية ومحتوى تعليمي متقدم'
                    : 'Get exclusive signals, professional analyses, and advanced learning content'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Plans */}
          <div className="grid grid-cols-2 gap-3">
            {plans.map((plan, idx) => (
              <motion.button
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.1 }}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  'relative rounded-2xl p-4 text-center border-2 transition-all duration-300',
                  selectedPlan === plan.id
                    ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/10'
                    : 'border-border/50 bg-card/50 hover:border-amber-500/30'
                )}
              >
                {plan.savings && (
                  <Badge className="absolute -top-2.5 start-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 border-0">
                    <Sparkles className="w-3 h-3 me-0.5" />
                    {plan.savings}
                  </Badge>
                )}
                {selectedPlan === plan.id && (
                  <div className="absolute top-2 end-2 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <p className="text-sm font-medium text-muted-foreground">{plan.name}</p>
                <p className="text-2xl font-bold text-foreground mt-1 trading-number">
                  {plan.price}
                  <span className="text-xs text-muted-foreground font-normal">{plan.period}</span>
                </p>
              </motion.button>
            ))}
          </div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-border/50 bg-card/50 p-5 space-y-4"
          >
            <h3 className="font-bold text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {isRTL ? 'مزايا العضوية المميزة' : 'Premium Membership Benefits'}
            </h3>
            <div className="space-y-3">
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.06 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <feature.icon className={cn('w-4 h-4', feature.color)} />
                  </div>
                  <span className="text-sm text-foreground">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="space-y-3"
          >
            <Button
              onClick={handleRequestVip}
              disabled={requesting}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-600 hover:via-yellow-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/25 border-0"
            >
              {requesting ? (
                <span className="animate-pulse">{isRTL ? 'جارٍ الإرسال...' : 'Sending...'}</span>
              ) : (
                <>
                  <Crown className="w-5 h-5 me-2" />
                  {isRTL ? 'اشترك الآن' : 'Subscribe Now'}
                </>
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              {isRTL 
                ? 'سيتم التواصل معك عبر الواتساب لإتمام الدفع وتفعيل اشتراكك'
                : 'We will contact you via WhatsApp to complete payment and activate your subscription'}
            </p>
          </motion.div>

          {/* Broker alternative */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-5 text-center space-y-3"
          >
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">OR</span>
            </div>
            <div>
              <h3 className="font-bold text-foreground">
                {isRTL ? 'أو احصل على VIP مجاناً! 🎁' : 'Or get VIP for FREE! 🎁'}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL
                  ? 'افتح حساب تداول عبر وكالتنا في OneRoyal واحصل على عضوية VIP مجانية'
                  : 'Open a trading account through our OneRoyal agency and get free VIP membership'}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/services')}
              className="border-amber-500/50 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              {isRTL ? 'افتح حساب الآن' : 'Open Account Now'}
            </Button>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
};

export default VipPage;
