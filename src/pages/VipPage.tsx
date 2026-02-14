import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Crown, Check, Star, Radio, BookOpen, Shield, Zap, 
  ArrowLeft, Sparkles, Lock, TrendingUp, Users, Clock, MessageCircle, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';

const VipPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, isVip, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [requesting, setRequesting] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isRTL = i18n.language === 'ar';

  // Check if user has a pending subscription request
  const { data: pendingSub } = useQuery({
    queryKey: ['my-vip-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('vip_subscriptions' as any)
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  // Chat messages for pending subscription
  const { data: chatMessages = [], refetch: refetchChat } = useQuery({
    queryKey: ['my-sub-chat', (pendingSub as any)?.id],
    queryFn: async () => {
      if (!pendingSub) return [];
      const { data } = await supabase
        .from('subscription_messages' as any)
        .select('*')
        .eq('subscription_id', (pendingSub as any).id)
        .order('created_at', { ascending: true });
      return (data || []) as any[];
    },
    enabled: !!(pendingSub as any)?.id,
    refetchInterval: (pendingSub as any)?.id ? 5000 : false,
  });

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async () => {
      if (!pendingSub || !chatMessage.trim() || !user) return;
      const { error } = await supabase
        .from('subscription_messages' as any)
        .insert({
          subscription_id: (pendingSub as any).id,
          sender_id: user.id,
          content: chatMessage.trim(),
          is_admin: false,
        } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setChatMessage('');
      refetchChat();
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    },
  });
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
      const { error } = await supabase.rpc('request_vip_subscription' as any, {
        p_plan: selectedPlan,
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
            {pendingSub ? (
              <div className="space-y-3">
                <div className="w-full h-14 text-lg font-bold rounded-2xl bg-muted flex items-center justify-center gap-2 text-muted-foreground">
                  <Clock className="w-5 h-5" />
                  {isRTL ? 'طلبك قيد المراجعة ⏳' : 'Your request is under review ⏳'}
                </div>
                
                {/* Chat toggle */}
                <Button
                  variant="outline"
                  className="w-full gap-2 border-primary/30 text-primary"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageCircle className="w-4 h-4" />
                  {isRTL ? 'محادثة مع الإدارة' : 'Chat with Admin'}
                  {chatMessages.length > 0 && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] h-5 px-1.5">{chatMessages.length}</Badge>
                  )}
                </Button>

                {/* Chat Section */}
                {showChat && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="rounded-2xl border border-border/50 bg-card overflow-hidden"
                  >
                    <div className="px-4 py-2.5 border-b border-border/30 flex items-center gap-2 bg-muted/30">
                      <MessageCircle className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{isRTL ? 'محادثة طلب الاشتراك' : 'Subscription Request Chat'}</span>
                    </div>
                    
                    <div className="overflow-y-auto p-3 space-y-2 min-h-[150px] max-h-[250px]">
                      {chatMessages.length === 0 ? (
                        <div className="flex items-center justify-center h-[150px] text-muted-foreground text-xs text-center">
                          {isRTL ? 'لا توجد رسائل بعد\nيمكنك إرسال رسالة للإدارة بخصوص طلبك' : 'No messages yet\nYou can send a message to admin about your request'}
                        </div>
                      ) : (
                        chatMessages.map((msg: any) => (
                          <div key={msg.id} className={cn('flex', msg.is_admin ? 'justify-start' : 'justify-end')}>
                            <div className={cn(
                              'max-w-[80%] rounded-2xl px-3 py-2 text-sm',
                              msg.is_admin 
                                ? 'bg-primary/10 text-foreground rounded-tl-none' 
                                : 'bg-muted text-foreground rounded-tr-none'
                            )}>
                              <div className="flex items-center gap-1 mb-0.5">
                                <span className={cn('text-[10px] font-medium', msg.is_admin ? 'text-primary' : 'text-muted-foreground')}>
                                  {msg.is_admin ? '🛡️ الإدارة' : '👤 أنت'}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                              <span className="text-[9px] text-muted-foreground mt-1 block">
                                {new Date(msg.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form 
                      className="flex gap-2 p-2 border-t border-border/30"
                      onSubmit={(e) => { e.preventDefault(); sendMessage.mutate(); }}
                    >
                      <Input
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
                        className="flex-1 h-9 text-sm"
                      />
                      <Button 
                        type="submit" 
                        size="sm" 
                        disabled={!chatMessage.trim() || sendMessage.isPending}
                        className="h-9 w-9 p-0 bg-primary"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </motion.div>
                )}
                
                <p className="text-center text-xs text-muted-foreground">
                  {isRTL ? 'سيتم إشعارك فور معالجة طلبك' : 'You will be notified once your request is processed'}
                </p>
              </div>
            ) : (
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
            )}
            {!pendingSub && (
              <p className="text-center text-xs text-muted-foreground">
                {isRTL 
                  ? 'سيتم التواصل معك عبر التطبيق لإتمام الدفع وتفعيل اشتراكك'
                  : 'We will contact you through the app to complete payment and activate your subscription'}
              </p>
            )}
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
              onClick={() => navigate('/services?tab=brokers')}
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
