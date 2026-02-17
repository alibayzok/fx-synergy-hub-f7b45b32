import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/data/countries';
import { signInWithGoogle } from '@/lib/auth-helpers';
import { useAppSettings } from '@/hooks/useAppSettings';
import appLogo from '@/assets/logo-dark.png';

type AuthMode = 'login' | 'register' | 'forgot' | 'check-email';

const AuthPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, verifyOtp, resetPassword, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const { getSetting } = useAppSettings();
  const logoUrl = getSetting('logo_url');
  const authBgUrl = getSetting('auth_bg_url');

  // Redirect if user is already authenticated
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

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle({
        redirectTo: window.location.origin,
      });
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: t('common.error'),
        description: t('auth.googleSignInError'),
        variant: 'destructive'
      });
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
          toast({
            title: t('common.error'),
            description: error.message,
            variant: 'destructive'
          });
        } else {
          navigate('/');
        }
      } else if (mode === 'register') {
        // Check if phone already exists
        if (phone) {
          const { data: existingPhone } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', phone)
            .maybeSingle();
          if (existingPhone) {
            toast({
              title: t('auth.duplicatePhone'),
              description: t('auth.duplicatePhoneDesc'),
              variant: 'destructive'
            });
            setLoading(false);
            return;
          }
        }

        const { error } = await signUp(email, password, { firstName, lastName, country, phone });
        if (error) {
          const msg = error.message?.toLowerCase() || '';
          if (msg.includes('already registered') || msg.includes('already been registered') || msg.includes('user already registered')) {
            toast({
              title: t('auth.duplicateEmail'),
              description: t('auth.duplicateEmailDesc'),
              variant: 'destructive'
            });
          } else {
            toast({
              title: t('common.error'),
              description: error.message,
              variant: 'destructive'
            });
          }
        } else {
          setPendingEmail(email);
          setMode('check-email');
          toast({
            title: t('auth.checkEmail'),
            description: t('auth.confirmEmailSent') || 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني'
          });
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: t('common.error'),
            description: error.message,
            variant: 'destructive'
          });
        } else {
          toast({
            title: t('auth.checkEmail'),
            description: t('auth.resetEmailSent')
          });
          setMode('login');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative" dir={isRTL ? 'rtl' : 'ltr'}>
      {authBgUrl && (
        <img src={authBgUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" />
      )}
      {/* Header */}
      <header className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (mode === 'check-email') {
              setMode('register');
            } else {
              navigate('/');
            }
          }}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t('common.back')}
        </Button>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          {/* Logo/Title */}
          <div className="text-center space-y-3">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
              <img src={appLogo} alt={t('app.name')} className="relative h-20 w-20 mx-auto object-cover rounded-full border-2 border-primary/40 shadow-xl" />
            </div>
            <h1 className="text-3xl font-bold text-primary">
              {t('app.name')}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login' ? t('auth.login') : mode === 'register' ? t('auth.register') : mode === 'check-email' ? (t('auth.checkEmail') || 'تحقق من بريدك') : t('auth.forgotPassword')}
            </p>
          </div>

          {/* Check Email Mode */}
          {mode === 'check-email' ? (
            <div className="space-y-6">
              <div className="text-center space-y-4">
                <Mail className="w-16 h-16 mx-auto text-primary" />
                <h2 className="text-xl font-semibold">{t('auth.checkEmail') || 'تحقق من بريدك الإلكتروني'}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('auth.confirmEmailSentTo') || 'تم إرسال رابط التأكيد إلى'}{' '}
                  <span className="font-medium text-foreground">{pendingEmail}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('auth.clickLinkToConfirm') || 'اضغط على الرابط في البريد لتأكيد حسابك، ثم عد هنا لتسجيل الدخول'}
                </p>
              </div>

              <Button
                className="w-full"
                onClick={() => setMode('login')}
              >
                {t('auth.backToLogin') || 'العودة لتسجيل الدخول'}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-sm text-primary hover:underline"
                >
                  {t('auth.backToRegister') || 'العودة للتسجيل'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <>
                    {/* First Name */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName">{t('auth.firstName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                        <Input
                          id="firstName"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="pl-10 rtl:pl-3 rtl:pr-10"
                          placeholder={t('auth.firstNamePlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    {/* Last Name */}
                    <div className="space-y-2">
                      <Label htmlFor="lastName">{t('auth.lastName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                        <Input
                          id="lastName"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="pl-10 rtl:pl-3 rtl:pr-10"
                          placeholder={t('auth.lastNamePlaceholder')}
                          required
                        />
                      </div>
                    </div>

                    {/* Country */}
                    <div className="space-y-2">
                      <Label htmlFor="country">{t('auth.country')}</Label>
                      <Select value={country} onValueChange={setCountry} required>
                        <SelectTrigger className="w-full">
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

                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('auth.phone')}</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 rtl:pl-3 rtl:pr-10"
                          placeholder={t('auth.phonePlaceholder')}
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 rtl:pl-3 rtl:pr-10"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                {mode !== 'forgot' && (
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 rtl:pl-10 rtl:pr-10"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground rtl:right-auto rtl:left-3"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? t('common.loading') : (
                    mode === 'login' ? t('auth.login') : 
                    mode === 'register' ? t('auth.register') : 
                    t('auth.sendResetLink')
                  )}
                </Button>
              </form>

              {/* Social Login - only show for login and register modes */}
              {mode !== 'forgot' && (
                <>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        {t('auth.orContinueWith')}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleGoogleSignIn}
                    disabled={googleLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    {googleLoading ? t('common.loading') : t('auth.signInWithGoogle')}
                  </Button>
                </>
              )}

              {/* Forgot Password Link (only in login mode) */}
              {mode === 'login' && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-muted-foreground hover:text-primary hover:underline"
                  >
                    {t('auth.forgotPassword')}
                  </button>
                </div>
              )}

              {/* Toggle Mode */}
              <div className="text-center">
                {mode === 'forgot' ? (
                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="text-sm text-primary hover:underline"
                  >
                    {t('auth.backToLogin')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                    className="text-sm text-primary hover:underline"
                  >
                    {mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}
                  </button>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuthPage;
