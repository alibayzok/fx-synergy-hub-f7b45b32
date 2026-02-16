import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, FileCheck, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface KYCUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const KYCUploadDialog = ({ open, onOpenChange }: KYCUploadDialogProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';

  const [docType, setDocType] = useState('id_card');
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const docTypes = [
    { value: 'id_card', label: isRTL ? 'بطاقة هوية' : 'ID Card' },
    { value: 'passport', label: isRTL ? 'جواز سفر' : 'Passport' },
    { value: 'driver_license', label: isRTL ? 'رخصة قيادة' : "Driver's License" },
  ];

  const uploadFile = async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    
    // Get signed URL for private bucket
    const { data } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
    return data?.signedUrl || path;
  };

  const handleSubmit = async () => {
    if (!user || !frontFile || !selfieFile) return;

    setUploading(true);
    try {
      const timestamp = Date.now();
      const frontUrl = await uploadFile(frontFile, `${user.id}/front_${timestamp}.${frontFile.name.split('.').pop()}`);
      const selfieUrl = await uploadFile(selfieFile, `${user.id}/selfie_${timestamp}.${selfieFile.name.split('.').pop()}`);
      let backUrl = null;
      if (backFile) {
        backUrl = await uploadFile(backFile, `${user.id}/back_${timestamp}.${backFile.name.split('.').pop()}`);
      }

      const { error } = await supabase.from('verification_requests').insert({
        user_id: user.id,
        document_type: docType,
        document_front_url: frontUrl,
        document_back_url: backUrl,
        selfie_url: selfieUrl,
        status: 'pending',
      });

      if (error) throw error;

      // Update profile kyc_status
      await supabase.from('profiles').update({ kyc_status: 'pending' }).eq('user_id', user.id);

      setSuccess(true);
      toast({ title: isRTL ? 'تم إرسال طلب التوثيق بنجاح ✅' : 'Verification request submitted ✅' });

      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setFrontFile(null);
        setBackFile(null);
        setSelfieFile(null);
      }, 2000);
    } catch (err: any) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const FileInput = ({ label, file, onFile, required = true, icon: Icon }: { label: string; file: File | null; onFile: (f: File | null) => void; required?: boolean; icon: any }) => (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {label}
        {required && <span className="text-destructive">*</span>}
      </label>
      <label className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-all",
        file ? "border-emerald-500/40 bg-emerald-500/5" : "border-border/40 hover:border-primary/40 hover:bg-primary/5"
      )}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] || null)}
        />
        {file ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
          </div>
        ) : (
          <>
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {isRTL ? 'اضغط لرفع الصورة' : 'Click to upload'}
            </span>
          </>
        )}
      </label>
    </div>
  );

  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {isRTL ? 'تم إرسال الطلب بنجاح!' : 'Request Submitted!'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isRTL ? 'سيتم مراجعة طلبك من قبل الإدارة.' : 'Your request will be reviewed by admins.'}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-blue-500" />
            {isRTL ? 'توثيق الهوية' : 'Identity Verification'}
          </DialogTitle>
          <DialogDescription>
            {isRTL ? 'ارفع صورة هويتك للتحقق من حسابك' : 'Upload your ID documents to verify your account'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Document Type */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">
              {isRTL ? 'نوع الوثيقة' : 'Document Type'}
            </label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {docTypes.map(dt => (
                  <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Front Image */}
          <FileInput
            label={isRTL ? 'صورة الوجه الأمامي' : 'Front Side'}
            file={frontFile}
            onFile={setFrontFile}
            icon={Upload}
          />

          {/* Back Image */}
          <FileInput
            label={isRTL ? 'صورة الوجه الخلفي (اختياري)' : 'Back Side (Optional)'}
            file={backFile}
            onFile={setBackFile}
            required={false}
            icon={Upload}
          />

          {/* Selfie */}
          <FileInput
            label={isRTL ? 'صورة سيلفي مع الهوية' : 'Selfie with ID'}
            file={selfieFile}
            onFile={setSelfieFile}
            icon={Camera}
          />

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={!frontFile || !selfieFile || uploading}
            className="w-full gap-2 rounded-xl"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {isRTL ? 'جاري الرفع...' : 'Uploading...'}
              </>
            ) : (
              <>
                <FileCheck className="w-4 h-4" />
                {isRTL ? 'إرسال طلب التوثيق' : 'Submit Verification'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
