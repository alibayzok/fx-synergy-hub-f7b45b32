import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/data/countries';
import { signInWithGoogle } from '@/lib/auth-helpers';
import { useAppSettings } from '@/hooks/useAppSettings';
import appLogo from '@/assets/logo-dark.png';

type AuthMode = 'login' | 'register' | 'forgot' | 'verify-otp';

const AuthPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, verifyOtp, resetPassword, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const { getSetting } = useAppSettings();
  const logoUrl = getSetting('logo_url');
  const authBgUrl = getSetting('auth_bg_url');

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle({
        redirectTo: window.location.origin,
      });
      if (error) {
        toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: t('common.error'), description: t('auth.googleSignInError'), variant: 'destructive' });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
        } else {
          navigate('/');
        }
      } else if (mode === 'register') {
        const selectedCountry = countries.find(c => c.code === country);
        // Normalize phone: remove spaces, dashes, parentheses
        let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        // Remove leading + and country code if user typed it manually
        if (selectedCountry) {
          const dialDigits = selectedCountry.dialCode.replace('+', '');
          if (cleanPhone.startsWith('+')) {
            cleanPhone = cleanPhone.replace(/^\+/, '');
            if (cleanPhone.startsWith(dialDigits)) {
              cleanPhone = cleanPhone.slice(dialDigits.length);
            }
          }
          // Remove leading zero (e.g. 05XXXXXXXX → 5XXXXXXXX)
          if (cleanPhone.startsWith('0')) {
            cleanPhone = cleanPhone.slice(1);
          }
        }
        const fullPhone = selectedCountry ? `${selectedCountry.dialCode}${cleanPhone}` : cleanPhone;
        
        if (cleanPhone) {
          // Check all possible formats of the same number
          const dialDigits = selectedCountry?.dialCode?.replace('+', '') || '';
          const phoneVariants = [
            fullPhone,                                    // +9665XXXXXXXX
            `${selectedCountry?.dialCode}0${cleanPhone}`, // +96605XXXXXXXX (with zero)
            cleanPhone,                                    // 5XXXXXXXX (raw)
            `0${cleanPhone}`,                              // 05XXXXXXXX (with leading zero)
            `${dialDigits}${cleanPhone}`,                  // 9665XXXXXXXX (without +)
          ].filter(Boolean);

          const { data: existingPhone } = await supabase
            .from('profiles')
            .select('id')
            .in('phone', phoneVariants)
            .limit(1)
            .maybeSingle();
          if (existingPhone) {
            toast({ title: t('auth.duplicatePhone'), description: t('auth.duplicatePhoneDesc'), variant: 'destructive' });
            setLoading(false);
            return;
          }
        }
        const { error } = await signUp(email, password, { firstName, lastName, country, phone: fullPhone });
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already registered')) {
            toast({ title: t('auth.duplicateEmail'), description: t('auth.duplicateEmailDesc'), variant: 'destructive' });
          } else {
            toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
          }
        } else {
          setPendingEmail(email);
          setMode('verify-otp');
          toast({ title: t('auth.checkEmail'), description: t('auth.otpSent') || 'تم إرسال رمز التحقق إلى بريدك الإلكتروني' });
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
        } else {
          toast({ title: t('auth.checkEmail'), description: t('auth.resetEmailSent') });
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Floating gold particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 8 + 6,
    delay: Math.random() * 4,
  }));

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(145deg, #050508 0%, #0a0a12 30%, #0d0b14 60%, #080810 100%)' }}>
      
      {/* Ambient light effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      <div className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full opacity-10 blur-[100px]"
        style={{ background: 'radial-gradient(circle, hsl(45, 80%, 50%) 0%, transparent 70%)' }} />

      {/* Floating particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, hsl(45, 80%, 65%), hsl(45, 70%, 40%))',
            boxShadow: `0 0 ${p.size * 3}px hsl(45, 80%, 50% / 0.4)`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.8, 0.2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {authBgUrl && (
        <img src={authBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-5 pointer-events-none" />
      )}

      {/* Header */}
      <header className="p-4 relative z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (mode === 'verify-otp') { setMode('register'); setOtpCode(''); }
            else navigate('/');
          }}
          className="gap-2 text-white/60 hover:text-white hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('common.back')}
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            {/* Glass Card */}
            <div className="relative rounded-3xl border border-white/[0.08] p-8 space-y-7"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                backdropFilter: 'blur(40px)',
                boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
              
              {/* Decorative corner glow */}
              <div className="absolute -top-px -left-px w-24 h-24 rounded-tl-3xl opacity-40"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent)' }} />

              {/* Logo */}
              <div className="text-center space-y-4">
                <motion.div
                  className="relative mx-auto w-24 h-24"
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                  style={{ perspective: 800, transformStyle: 'preserve-3d' }}
                >
                  <div className="absolute inset-0 rounded-full blur-2xl opacity-40"
                    style={{ background: 'radial-gradient(circle, hsl(var(--primary)), transparent)' }} />
                  <div className="absolute -inset-2 rounded-full border border-primary/20 animate-pulse" />
                  <img
                    src={appLogo}
                    alt={t('app.name')}
                    className="relative h-24 w-24 mx-auto object-cover rounded-full border-2 border-primary/40 shadow-2xl"
                    style={{ boxShadow: '0 0 30px hsl(var(--primary) / 0.3)' }}
                  />
                </motion.div>
                <div>
                  <h1 className="text-3xl font-bold tracking-wide"
                    style={{ background: 'linear-gradient(135deg, hsl(45, 80%, 65%), hsl(var(--primary)), hsl(45, 80%, 55%))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    {t('app.name')}
                  </h1>
                  <p className="text-sm text-white/40 mt-1 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : mode === 'verify-otp' ? t('auth.verifyOtp') : t('auth.forgotPassword')}
                  </p>
                </div>
              </div>

              {/* OTP Verification */}
              {mode === 'verify-otp' ? (
                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <div className="relative inline-block">
                        <div className="absolute inset-0 rounded-full blur-xl opacity-50"
                          style={{ background: 'hsl(var(--primary))' }} />
                        <ShieldCheck className="relative w-16 h-16 mx-auto text-primary" />
                      </div>
                    </motion.div>
                    <h2 className="text-xl font-semibold text-white">{t('auth.verifyOtp')}</h2>
                    <p className="text-sm text-white/50">
                      {t('auth.otpSentTo')}{' '}
                      <span className="font-medium text-primary">{pendingEmail}</span>
                    </p>
                  </div>

                  <div className="flex justify-center" dir="ltr">
                    <InputOTP maxLength={8} value={otpCode} onChange={setOtpCode}>
                      <InputOTPGroup className="gap-2">
                        {[0,1,2,3,4,5,6,7].map(i => (
                          <InputOTPSlot key={i} index={i} className="w-10 h-12 rounded-xl border-white/10 bg-white/[0.04] text-white text-lg font-semibold shadow-inner" />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full h-12 rounded-xl text-base font-semibold border-0 transition-all duration-300"
                    style={{
                      background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(45, 70%, 40%))',
                      boxShadow: otpCode.length === 8 ? '0 8px 30px hsl(var(--primary) / 0.4)' : 'none',
                    }}
                    disabled={loading || otpCode.length !== 8}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const { error } = await verifyOtp(pendingEmail, otpCode);
                        if (error) {
                          toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
                        } else {
                          toast({ title: t('auth.verificationSuccess') || 'تم التحقق بنجاح', description: t('auth.accountVerified') || 'تم تأكيد حسابك بنجاح' });
                          navigate('/');
                        }
                      } finally { setLoading(false); }
                    }}
                  >
                    {loading ? t('common.loading') : t('auth.verify')}
                  </Button>

                  <div className="text-center">
                    <button type="button" onClick={() => { setMode('register'); setOtpCode(''); }}
                      className="text-sm text-primary/70 hover:text-primary transition-colors">
                      {t('auth.backToRegister') || 'العودة للتسجيل'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="text-white/60 text-xs">{t('auth.firstName')}</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rtl:left-auto rtl:right-3" />
                              <Input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                                className="pl-10 rtl:pl-3 rtl:pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11 focus:border-primary/50 focus:ring-primary/20"
                                placeholder={t('auth.firstNamePlaceholder')} required />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="text-white/60 text-xs">{t('auth.lastName')}</Label>
                            <div className="relative">
                              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rtl:left-auto rtl:right-3" />
                              <Input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                                className="pl-10 rtl:pl-3 rtl:pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11 focus:border-primary/50 focus:ring-primary/20"
                                placeholder={t('auth.lastNamePlaceholder')} required />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-white/60 text-xs">{t('auth.country')}</Label>
                          <Select value={country} onValueChange={setCountry} required>
                            <SelectTrigger className="w-full bg-white/[0.04] border-white/[0.08] text-white rounded-xl h-11 focus:border-primary/50">
                              <SelectValue placeholder={t('auth.selectCountry')} />
                            </SelectTrigger>
                            <SelectContent>
                              {countries.map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {i18n.language === 'ar' ? c.name.ar : c.name.en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-white/60 text-xs">{t('auth.phone')}</Label>
                          <div className="relative flex gap-2" dir="ltr">
                            <div className="flex items-center justify-center h-11 px-3 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/60 text-sm font-mono min-w-[70px] shrink-0">
                              {countries.find(c => c.code === country)?.dialCode || '+---'}
                            </div>
                            <div className="relative flex-1">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                                className="pl-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11 focus:border-primary/50 focus:ring-primary/20"
                                placeholder="5XXXXXXXX" required />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-white/60 text-xs">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rtl:left-auto rtl:right-3" />
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 rtl:pl-3 rtl:pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11 focus:border-primary/50 focus:ring-primary/20"
                          placeholder="email@example.com" required />
                      </div>
                    </div>

                    {mode !== 'forgot' && (
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/60 text-xs">{t('auth.password')}</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rtl:left-auto rtl:right-3" />
                          <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 rtl:pl-10 rtl:pr-10 bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/25 rounded-xl h-11 focus:border-primary/50 focus:ring-primary/20"
                            placeholder="••••••••" required minLength={6} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors rtl:right-auto rtl:left-3">
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'login' && (
                      <div className="flex justify-end">
                        <button type="button" onClick={() => setMode('forgot')}
                          className="text-xs text-white/40 hover:text-primary transition-colors">
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                    )}

                    <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold border-0 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(45, 70%, 40%))',
                        boxShadow: '0 8px 30px hsl(var(--primary) / 0.3)',
                      }}
                      disabled={loading}>
                      {loading ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      ) : (
                        mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : t('auth.sendResetLink')
                      )}
                    </Button>
                  </form>

                  {mode !== 'forgot' && (
                    <>
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-white/[0.06]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="px-3 text-white/30" style={{ background: 'rgba(10,10,18,0.8)' }}>
                            {t('auth.orContinueWith')}
                          </span>
                        </div>
                      </div>

                      <Button type="button" variant="outline"
                        className="w-full h-11 rounded-xl gap-2 bg-white/[0.03] border-white/[0.08] text-white/70 hover:bg-white/[0.06] hover:text-white transition-all"
                        onClick={handleGoogleSignIn} disabled={googleLoading}>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {googleLoading ? t('common.loading') : t('auth.signInWithGoogle')}
                      </Button>
                    </>
                  )}

                  <div className="text-center">
                    {mode === 'forgot' ? (
                      <button type="button" onClick={() => setMode('login')}
                        className="text-sm text-primary/70 hover:text-primary transition-colors">
                        {t('auth.backToLogin')}
                      </button>
                    ) : (
                      <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        className="text-sm text-white/40 hover:text-primary transition-colors">
                        {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
