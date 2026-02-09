import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Globe, Moon, Sun, ChevronLeft, ChevronRight, 
  TrendingUp, BarChart3, Shield, Users, Sparkles,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

type TradingExperience = 'beginner' | 'intermediate' | 'advanced' | 'professional';
type PreferredAsset = 'forex' | 'metals' | 'crypto';
type TradingStyle = 'scalping' | 'day_trading' | 'swing' | 'position';
type TradingGoal = 'income' | 'growth' | 'learning' | 'fun';

const TOTAL_STEPS = 5;

const OnboardingPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { setTheme, resolvedTheme } = useTheme();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light'>(resolvedTheme);
  const [experience, setExperience] = useState<TradingExperience | null>(null);
  const [preferredAssets, setPreferredAssets] = useState<PreferredAsset[]>([]);
  const [tradingStyle, setTradingStyle] = useState<TradingStyle | null>(null);
  const [tradingGoal, setTradingGoal] = useState<TradingGoal | null>(null);
  const [saving, setSaving] = useState(false);

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleThemeSelect = (theme: 'dark' | 'light') => {
    setSelectedTheme(theme);
    setTheme(theme);
  };

  const toggleAsset = (asset: PreferredAsset) => {
    setPreferredAssets(prev => 
      prev.includes(asset) ? prev.filter(a => a !== asset) : [...prev, asset]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          language: selectedLanguage,
          trading_preferences: {
            experience,
            preferred_assets: preferredAssets,
            trading_style: tradingStyle,
            trading_goal: tradingGoal,
          } as any,
        })
        .eq('user_id', user.id);
      
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error saving onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('user_id', user.id);
      navigate('/', { replace: true });
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return true; // welcome
      case 1: return !!selectedLanguage;
      case 2: return true; // theme
      case 3: return !!experience;
      case 4: return preferredAssets.length > 0 && !!tradingStyle && !!tradingGoal;
      default: return true;
    }
  };

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex flex-col items-center text-center space-y-6 px-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center"
            >
              <TrendingUp className="w-12 h-12 text-primary" />
            </motion.div>
            <h1 className="text-3xl font-bold text-foreground">
              {isRTL ? 'مرحباً بك في' : 'Welcome to'}
            </h1>
            <p className="text-2xl font-bold gold-gradient">FX Synergy Hub</p>
            <p className="text-muted-foreground text-lg max-w-xs">
              {isRTL 
                ? 'عزز كفاءة التداول الخاصة بك مع التوصيات والتحليلات والمجتمع'
                : 'Boost your trading with signals, analysis, and community'}
            </p>
            <div className="flex gap-6 pt-4">
              {[
                { icon: BarChart3, label: isRTL ? 'تحليلات' : 'Analysis' },
                { icon: Shield, label: isRTL ? 'توصيات' : 'Signals' },
                { icon: Users, label: isRTL ? 'مجتمع' : 'Community' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 + i * 0.15 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="flex flex-col items-center text-center space-y-6 px-4">
            <Globe className="w-12 h-12 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {isRTL ? 'اختر لغتك المفضلة' : 'Choose your preferred language'}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? 'اختر لغتك المفضلة' : 'Select your preferred language'}
            </p>
            <div className="w-full max-w-sm space-y-3">
              {[
                { code: 'en', label: 'English', flag: '🇺🇸' },
                { code: 'ar', label: 'العربية', flag: '🇸🇦' },
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 flex items-center gap-4 transition-all",
                    selectedLanguage === lang.code
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                      : "border-border/50 bg-card/50 hover:border-primary/50"
                  )}
                >
                  <span className="text-3xl">{lang.flag}</span>
                  <span className="text-lg font-medium text-foreground">{lang.label}</span>
                  {selectedLanguage === lang.code && (
                    <Check className="w-5 h-5 text-primary ms-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center text-center space-y-6 px-4">
            {resolvedTheme === 'dark' ? (
              <Moon className="w-12 h-12 text-primary" />
            ) : (
              <Sun className="w-12 h-12 text-primary" />
            )}
            <h2 className="text-2xl font-bold text-foreground">
              {isRTL ? 'اختر السمة المفضلة لديك' : 'Choose your preferred theme'}
            </h2>
            <p className="text-muted-foreground">
              {isRTL ? 'اختر السمة المفضلة لديك لتناسب ذوقك' : 'Pick the theme that suits your style'}
            </p>
            <div className="flex gap-4">
              {[
                { value: 'dark' as const, icon: Moon, label: isRTL ? 'داكن' : 'Dark' },
                { value: 'light' as const, icon: Sun, label: isRTL ? 'فاتح' : 'Light' },
              ].map(theme => (
                <button
                  key={theme.value}
                  onClick={() => handleThemeSelect(theme.value)}
                  className={cn(
                    "relative w-36 h-48 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all",
                    selectedTheme === theme.value
                      ? "border-primary shadow-lg shadow-primary/20"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <div className={cn(
                    "w-20 h-28 rounded-lg border overflow-hidden",
                    theme.value === 'dark' 
                      ? "bg-[#0d1117] border-[#1e2530]" 
                      : "bg-[#faf9f7] border-[#e5e0d9]"
                  )}>
                    {/* Mini UI preview */}
                    <div className={cn(
                      "h-4 flex items-center gap-1 px-2",
                      theme.value === 'dark' ? "bg-[#161b22]" : "bg-[#f0ede8]"
                    )}>
                      <div className={cn("w-4 h-1.5 rounded-sm", theme.value === 'dark' ? "bg-blue-500" : "bg-blue-500")} />
                      <div className={cn("w-3 h-1.5 rounded-sm", theme.value === 'dark' ? "bg-[#2d333b]" : "bg-[#ddd8d0]")} />
                      <div className={cn("w-3 h-1.5 rounded-sm", theme.value === 'dark' ? "bg-[#2d333b]" : "bg-[#ddd8d0]")} />
                    </div>
                    <div className="p-1.5 space-y-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={cn("h-1.5 rounded-sm", theme.value === 'dark' ? "bg-[#2d333b]" : "bg-[#ddd8d0]")} style={{ width: `${70 - i * 10}%` }} />
                      ))}
                      <div className={cn("mt-2 h-8 rounded", theme.value === 'dark' ? "bg-[#1e2530]" : "bg-[#e8e3dc]")} />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">{theme.label}</span>
                  {selectedTheme === theme.value && (
                    <div className="absolute -top-2 -end-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center text-center space-y-5 px-4">
            <Sparkles className="w-10 h-10 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {isRTL ? 'ما مستوى خبرتك في التداول؟' : "What's your trading experience?"}
            </h2>
            <div className="w-full max-w-sm space-y-3">
              {([
                { value: 'beginner', ar: 'مبتدئ', en: 'Beginner', desc: isRTL ? 'بدأت مؤخراً' : 'Just starting out' },
                { value: 'intermediate', ar: 'متوسط', en: 'Intermediate', desc: isRTL ? '1-3 سنوات خبرة' : '1-3 years experience' },
                { value: 'advanced', ar: 'متقدم', en: 'Advanced', desc: isRTL ? '3+ سنوات خبرة' : '3+ years experience' },
                { value: 'professional', ar: 'محترف', en: 'Professional', desc: isRTL ? 'تداول بدوام كامل' : 'Full-time trader' },
              ] as { value: TradingExperience; ar: string; en: string; desc: string }[]).map(level => (
                <button
                  key={level.value}
                  onClick={() => setExperience(level.value)}
                  className={cn(
                    "w-full p-4 rounded-xl border-2 text-start transition-all",
                    experience === level.value
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-card/50 hover:border-primary/50"
                  )}
                >
                  <p className="font-medium text-foreground">{isRTL ? level.ar : level.en}</p>
                  <p className="text-sm text-muted-foreground">{level.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center text-center space-y-4 px-4">
            <BarChart3 className="w-10 h-10 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              {isRTL ? 'أخبرنا المزيد عن أسلوبك' : 'Tell us about your style'}
            </h2>
            
            {/* Preferred Assets */}
            <div className="w-full max-w-sm text-start">
              <p className="text-sm font-medium text-foreground mb-2">
                {isRTL ? 'الأصول المفضلة (اختر واحد أو أكثر)' : 'Preferred assets (select one or more)'}
              </p>
              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'forex', label: isRTL ? 'فوركس' : 'Forex' },
                  { value: 'metals', label: isRTL ? 'معادن' : 'Metals' },
                  { value: 'crypto', label: isRTL ? 'كريبتو' : 'Crypto' },
                ] as { value: PreferredAsset; label: string }[]).map(asset => (
                  <button
                    key={asset.value}
                    onClick={() => toggleAsset(asset.value)}
                    className={cn(
                      "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                      preferredAssets.includes(asset.value)
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {asset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trading Style */}
            <div className="w-full max-w-sm text-start">
              <p className="text-sm font-medium text-foreground mb-2">
                {isRTL ? 'أسلوب التداول' : 'Trading style'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'scalping', label: isRTL ? 'سكالبينج' : 'Scalping' },
                  { value: 'day_trading', label: isRTL ? 'يومي' : 'Day Trading' },
                  { value: 'swing', label: isRTL ? 'سوينج' : 'Swing' },
                  { value: 'position', label: isRTL ? 'طويل المدى' : 'Position' },
                ] as { value: TradingStyle; label: string }[]).map(style => (
                  <button
                    key={style.value}
                    onClick={() => setTradingStyle(style.value)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                      tradingStyle === style.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trading Goal */}
            <div className="w-full max-w-sm text-start">
              <p className="text-sm font-medium text-foreground mb-2">
                {isRTL ? 'هدفك من التداول' : 'Your trading goal'}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'income', label: isRTL ? 'دخل إضافي' : 'Extra Income' },
                  { value: 'growth', label: isRTL ? 'تنمية رأس المال' : 'Capital Growth' },
                  { value: 'learning', label: isRTL ? 'تعلم التداول' : 'Learn Trading' },
                  { value: 'fun', label: isRTL ? 'هواية وتحدي' : 'Hobby & Challenge' },
                ] as { value: TradingGoal; label: string }[]).map(goal => (
                  <button
                    key={goal.value}
                    onClick={() => setTradingGoal(goal.value)}
                    className={cn(
                      "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                      tradingGoal === goal.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/50"
                    )}
                  >
                    {goal.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 start-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 py-8">
        <AnimatePresence mode="wait" custom={1}>
          <motion.div
            key={currentStep}
            custom={1}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="w-full max-w-md"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="p-4 pb-8">
        <div className="max-w-md mx-auto glass-card rounded-2xl p-4 flex items-center justify-between gap-4">
          {/* Back button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="shrink-0"
          >
            {isRTL ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>

          {/* Dots indicator */}
          <div className="flex gap-2 items-center">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-full transition-all duration-300",
                  i === currentStep 
                    ? "w-6 h-2.5 bg-primary" 
                    : i < currentStep 
                      ? "w-2.5 h-2.5 bg-primary/50" 
                      : "w-2.5 h-2.5 bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Skip / Next */}
          {currentStep < TOTAL_STEPS - 1 ? (
            <div className="flex gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={handleSkip} disabled={saving}>
                {isRTL ? 'تخطى' : 'Skip'}
              </Button>
              <Button size="sm" onClick={nextStep} disabled={!canProceed()}>
                {isRTL ? 'التالي' : 'Next'}
                {isRTL ? <ChevronLeft className="w-4 h-4 ms-1" /> : <ChevronRight className="w-4 h-4 ms-1" />}
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              onClick={handleComplete}
              disabled={saving || !canProceed()}
              className="shrink-0"
            >
              {saving 
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                : (isRTL ? 'ابدأ الآن' : "Let's Go!")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
