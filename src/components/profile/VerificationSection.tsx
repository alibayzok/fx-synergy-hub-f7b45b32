import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Mail, Phone, FileCheck, CheckCircle2, Clock, AlertCircle, ShieldCheck, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { KYCUploadDialog } from './KYCUploadDialog';
import { toast } from 'sonner';

export const VerificationSection = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = i18n.language === 'ar';
  const [showKYC, setShowKYC] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('is_verified, phone_verified, kyc_status, phone')
        .eq('user_id', user.id)
        .single();
      setProfile(data);
      if (data?.phone) setPhoneInput(data.phone);

    };
    fetchData();
  }, [user]);

  if (!profile) return null;

  const emailVerified = !!user?.email_confirmed_at;
  const phoneVerified = profile.phone_verified;
  const kycStatus = profile.kyc_status || 'none';
  

  const steps = [
    {
      icon: Mail,
      label: isRTL ? 'البريد الإلكتروني' : 'Email',
      done: emailVerified,
      status: emailVerified ? (isRTL ? 'مؤكد' : 'Verified') : (isRTL ? 'غير مؤكد' : 'Unverified'),
      color: emailVerified ? 'text-emerald-500' : 'text-muted-foreground',
    },
    {
      icon: Phone,
      label: isRTL ? 'رقم الهاتف' : 'Phone',
      done: phoneVerified,
      status: phoneVerified
        ? (isRTL ? 'موثق' : 'Verified')
        : (isRTL ? 'أضف رقم الهاتف' : 'Add phone number'),
      color: phoneVerified ? 'text-emerald-500' : 'text-muted-foreground',
    },
    {
      icon: FileCheck,
      label: isRTL ? 'الهوية الشخصية' : 'Identity (KYC)',
      done: kycStatus === 'approved',
      status: kycStatus === 'approved'
        ? (isRTL ? 'موثق' : 'Verified')
        : kycStatus === 'pending'
          ? (isRTL ? 'قيد المراجعة' : 'Pending')
          : kycStatus === 'rejected'
            ? (isRTL ? 'مرفوض' : 'Rejected')
            : (isRTL ? 'غير مقدم' : 'Not submitted'),
      color: kycStatus === 'approved' ? 'text-emerald-500' : kycStatus === 'pending' ? 'text-amber-500' : kycStatus === 'rejected' ? 'text-destructive' : 'text-muted-foreground',
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = Math.round((completedCount / steps.length) * 100);

  const handleSavePhone = async () => {
    if (!user || !phoneInput.trim()) return;
    setSavingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phoneInput.trim(), phone_verified: true })
        .eq('user_id', user.id);
      if (error) throw error;
      setProfile((prev: any) => ({ ...prev, phone: phoneInput.trim(), phone_verified: true }));
      toast.success(isRTL ? 'تم حفظ وتوثيق رقم الهاتف' : 'Phone saved and verified');
    } catch (err) {
      console.error('Save phone failed:', err);
      toast.error(isRTL ? 'فشل حفظ الرقم' : 'Failed to save phone');
    } finally {
      setSavingPhone(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 space-y-4 border border-border/30"
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-foreground">
              {isRTL ? 'توثيق الحساب' : 'Account Verification'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {isRTL ? `${completedCount}/${steps.length} خطوات مكتملة` : `${completedCount}/${steps.length} steps completed`}
            </p>
          </div>
          {profile.is_verified && (
            <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {isRTL ? 'موثق' : 'Verified'}
            </Badge>
          )}
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">{progress}%</p>
        </div>

        {/* Steps */}
        <div className="space-y-2.5">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const StatusIcon = step.done ? CheckCircle2 : step.status.includes('مراجعة') || step.status.includes('Pending') ? Clock : AlertCircle;
            return (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  step.done
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-card/30 border-border/20"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  step.done ? "bg-emerald-500/15" : "bg-muted/50"
                )}>
                  <Icon className={cn("w-4 h-4", step.done ? "text-emerald-500" : "text-muted-foreground")} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className={cn("text-xs", step.color)}>{step.status}</p>
                </div>
                <StatusIcon className={cn("w-4 h-4 shrink-0", step.color)} />
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          {/* Phone: show input if not verified */}
          {!phoneVerified && (
            <div className="flex gap-2">
              <Input
                type="tel"
                placeholder={isRTL ? 'أدخل رقم الهاتف' : 'Enter phone number'}
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                className="flex-1 rounded-xl"
                dir="ltr"
              />
              <Button
                onClick={handleSavePhone}
                disabled={!phoneInput.trim() || savingPhone}
                variant="outline"
                className="rounded-xl gap-1.5"
              >
                <Phone className="w-4 h-4" />
                {isRTL ? 'توثيق' : 'Verify'}
              </Button>
            </div>
          )}

          {/* KYC */}
          {kycStatus !== 'approved' && kycStatus !== 'pending' && (
            <Button
              onClick={() => setShowKYC(true)}
              className="w-full gap-2 rounded-xl"
              variant="default"
            >
              <FileCheck className="w-4 h-4" />
              {isRTL ? 'توثيق الهوية الآن' : 'Verify Identity Now'}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </Button>
          )}
        </div>
      </motion.div>

      <KYCUploadDialog open={showKYC} onOpenChange={setShowKYC} />
    </>
  );
};