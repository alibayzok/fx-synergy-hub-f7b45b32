import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { User, Phone, MapPin, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/data/countries';
import { supabase } from '@/integrations/supabase/client';
import appLogo from '@/assets/logo-dark.png';

const CompleteProfilePage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhone] = useState('');
  const [tradingStyles, setTradingStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const tradingStyleOptions = [
    { value: 'scalping', ar: 'سكالبينج', en: 'Scalping' },
    { value: 'day_trading', ar: 'يومي', en: 'Day Trading' },
    { value: 'swing', ar: 'سوينج', en: 'Swing' },
    { value: 'position', ar: 'طويل المدى', en: 'Position' },
  ];

  const toggleStyle = (value: string) => {
    setTradingStyles(prev =>
      prev.includes(value) ? prev.filter(s => s !== value) : [...prev, value]
    );
  };

  // Pre-fill existing data
  useEffect(() => {
    if (profile) {
      if (profile.first_name) setFirstName(profile.first_name);
      if (profile.last_name) setLastName(profile.last_name);
      if (profile.country) setCountry(profile.country);
      if (profile.phone) setPhone(profile.phone);
    }
  }, [profile]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Redirect if profile is already complete
  useEffect(() => {
    if (!profileLoading && profile && profile.first_name && profile.last_name && profile.country && profile.phone) {
      navigate('/', { replace: true });
    }
  }, [profile, profileLoading, navigate]);

  const selectedCountry = countries.find(c => c.code === country);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!firstName.trim() || !lastName.trim() || !country || !phone.trim()) {
      toast({ title: isRTL ? 'يرجى تعبئة جميع الحقول' : 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      // Normalize phone
      let cleanPhone = phone.replace(/[\s\-()]/g, '');
      if (selectedCountry) {
        const dialDigits = selectedCountry.dialCode.replace('+', '');
        if (cleanPhone.startsWith('+')) {
          cleanPhone = cleanPhone.replace(/^\+/, '');
          if (cleanPhone.startsWith(dialDigits)) {
            cleanPhone = cleanPhone.slice(dialDigits.length);
          }
        }
        if (cleanPhone.startsWith('0')) {
          cleanPhone = cleanPhone.slice(1);
        }
      }
      const fullPhone = selectedCountry ? `${selectedCountry.dialCode}${cleanPhone}` : cleanPhone;

      // Check duplicate phone
      if (cleanPhone) {
        const dialDigits = selectedCountry?.dialCode?.replace('+', '') || '';
        const phoneVariants = [
          fullPhone,
          `${selectedCountry?.dialCode}0${cleanPhone}`,
          cleanPhone,
          `0${cleanPhone}`,
          `${dialDigits}${cleanPhone}`,
        ].filter(Boolean);

        const { data: existingPhone } = await supabase
          .from('profiles')
          .select('id, user_id')
          .in('phone', phoneVariants)
          .limit(1)
          .maybeSingle();

        if (existingPhone && existingPhone.user_id !== user.id) {
          toast({ title: isRTL ? 'رقم الهاتف مستخدم بالفعل' : 'Phone number already in use', variant: 'destructive' });
          setLoading(false);
          return;
        }
      }

      const displayName = `${firstName.trim()} ${lastName.trim()}`;
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          display_name: displayName,
          country,
          phone: fullPhone,
          trading_preferences: { trading_styles: tradingStyles } as any,
        })
        .eq('user_id', user.id);

      if (error) {
        toast({ title: isRTL ? 'حدث خطأ' : 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: isRTL ? '✅ تم حفظ البيانات بنجاح' : '✅ Profile updated successfully' });
        navigate('/', { replace: true });
      }
    } catch (err) {
      toast({ title: isRTL ? 'حدث خطأ' : 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}
      style={{ background: 'linear-gradient(145deg, #050508 0%, #0a0a12 30%, #0d0b14 60%, #080810 100%)' }}>
      
      {/* Ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full opacity-20 blur-[120px]"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />

      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="relative rounded-3xl border border-white/[0.08] p-8 space-y-7"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
              backdropFilter: 'blur(40px)',
              boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}>

            {/* Logo & Title */}
            <div className="text-center space-y-4">
              <img src={appLogo} alt="Logo" className="h-20 w-20 mx-auto rounded-full border-2 border-primary/40" />
              <div>
                <h1 className="text-2xl font-bold"
                  style={{ background: 'linear-gradient(135deg, hsl(45, 80%, 65%), hsl(var(--primary)))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {isRTL ? 'أكمل بياناتك' : 'Complete Your Profile'}
                </h1>
                <p className="text-sm text-white/40 mt-1 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {isRTL ? 'نحتاج بعض المعلومات الأساسية' : 'We need some basic information'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* First Name */}
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">{isRTL ? 'الاسم الأول' : 'First Name'}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    placeholder={isRTL ? 'أدخل اسمك الأول' : 'Enter your first name'}
                    className="ps-10 h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/20"
                    required
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">{isRTL ? 'الكنية' : 'Last Name'}</Label>
                <div className="relative">
                  <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <Input
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    placeholder={isRTL ? 'أدخل كنيتك' : 'Enter your last name'}
                    className="ps-10 h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/20"
                    required
                  />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">{isRTL ? 'الدولة' : 'Country'}</Label>
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/[0.04] text-white">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-white/30" />
                      <SelectValue placeholder={isRTL ? 'اختر الدولة' : 'Select country'} />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {countries.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {isRTL ? c.name.ar : c.name.en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</Label>
                <div className="flex gap-2">
                  <div className="flex items-center h-12 px-3 rounded-xl border border-white/10 bg-white/[0.04] text-white/60 text-sm min-w-[80px] justify-center">
                    {selectedCountry?.dialCode || '+'}
                  </div>
                  <div className="relative flex-1">
                    <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder={isRTL ? 'رقم الهاتف' : 'Phone number'}
                      className="ps-10 h-12 rounded-xl border-white/10 bg-white/[0.04] text-white placeholder:text-white/20"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Trading Style - Multi Select */}
              <div className="space-y-2">
                <Label className="text-white/60 text-xs">{isRTL ? 'أسلوب التداول (اختر واحد أو أكثر)' : 'Trading Style (select one or more)'}</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tradingStyleOptions.map(style => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => toggleStyle(style.value)}
                      className={cn(
                        "relative px-4 py-3 rounded-xl border text-sm font-medium transition-all text-center",
                        tradingStyles.includes(style.value)
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20"
                      )}
                    >
                      {isRTL ? style.ar : style.en}
                      {tradingStyles.includes(style.value) && (
                        <div className="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl text-base font-semibold border-0 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(45, 70%, 40%))',
                  boxShadow: '0 8px 30px hsl(var(--primary) / 0.4)',
                }}
                disabled={loading}
              >
                {loading
                  ? (isRTL ? 'جاري الحفظ...' : 'Saving...')
                  : (isRTL ? 'حفظ ومتابعة' : 'Save & Continue')}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CompleteProfilePage;
