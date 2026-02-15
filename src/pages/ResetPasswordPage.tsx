import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const ResetPasswordPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenError, setTokenError] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const handleRecoveryFlow = async () => {
      try {
        // Check for PKCE code in query params
        const code = searchParams.get('code');
        
        // Check for hash-based tokens (implicit flow)
        const hash = window.location.hash;
        const hashParams = new URLSearchParams(hash.replace('#', ''));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type') || searchParams.get('type');

        if (code) {
          // PKCE flow: exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Code exchange error:', error);
            setTokenError(true);
            setVerifying(false);
            return;
          }
          setSessionReady(true);
          setVerifying(false);
          return;
        }

        if (accessToken && type === 'recovery') {
          // Implicit flow: set session from hash
          const refreshToken = hashParams.get('refresh_token');
          if (refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('Session set error:', error);
              setTokenError(true);
              setVerifying(false);
              return;
            }
          }
          setSessionReady(true);
          setVerifying(false);
          return;
        }

        // No code or token - listen for auth state change (might auto-resolve)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY' && session) {
            setSessionReady(true);
            setVerifying(false);
            subscription.unsubscribe();
          }
        });

        // Check existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setSessionReady(true);
          setVerifying(false);
          subscription.unsubscribe();
          return;
        }

        // Give it a few seconds for auto-resolution
        setTimeout(() => {
          setVerifying(prev => {
            if (prev) {
              setTokenError(true);
              return false;
            }
            return prev;
          });
          subscription.unsubscribe();
        }, 5000);

      } catch (err) {
        console.error('Recovery flow error:', err);
        setTokenError(true);
        setVerifying(false);
      }
    };

    handleRecoveryFlow();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordMismatch'),
        variant: 'destructive'
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: t('common.error'),
        description: t('auth.passwordTooShort'),
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);
      if (error) {
        toast({
          title: t('common.error'),
          description: error.message,
          variant: 'destructive'
        });
      } else {
        setSuccess(true);
        toast({
          title: t('auth.passwordUpdated'),
          description: t('auth.passwordUpdatedDesc')
        });
        setTimeout(() => navigate('/'), 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Loading / verifying token
  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center space-y-4"
        >
          <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
          <p className="text-muted-foreground">{t('auth.verifyingLink', 'جاري التحقق من الرابط...')}</p>
        </motion.div>
      </div>
    );
  }

  // Token expired or invalid
  if (tokenError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">
            {t('auth.linkExpired', 'الرابط منتهي أو غير صالح')}
          </h1>
          <p className="text-muted-foreground">
            {t('auth.linkExpiredDesc', 'يبدو أن رابط إعادة تعيين كلمة المرور منتهي الصلاحية أو تم استخدامه مسبقاً. يرجى طلب رابط جديد.')}
          </p>
          <div className="flex flex-col gap-2 pt-4">
            <Button onClick={() => navigate('/auth')} className="w-full">
              {t('auth.requestNewLink', 'طلب رابط جديد')}
            </Button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              {t('auth.backToHome', 'العودة للرئيسية')}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Success
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <CheckCircle className="w-16 h-16 text-profit mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">{t('auth.passwordUpdated')}</h1>
          <p className="text-muted-foreground">{t('auth.redirecting')}</p>
        </motion.div>
      </div>
    );
  }

  // Password form
  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-primary">
              {t('app.name')}
            </h1>
            <p className="text-muted-foreground">
              {t('auth.setNewPassword')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.newPassword')}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground rtl:left-auto rtl:right-3" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 rtl:pl-10 rtl:pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? t('common.loading') : t('auth.updatePassword')}
            </Button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-sm text-primary hover:underline"
            >
              {t('auth.backToLogin')}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
