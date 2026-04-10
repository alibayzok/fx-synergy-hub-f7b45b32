import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Bell, Loader2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const BroadcastNotification = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ sent: number; failed: number; users: number } | null>(null);
  const isRTL = i18n.language === 'ar';

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: isRTL ? 'يرجى ملء العنوان والمحتوى' : 'Please fill title and body', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('broadcast-notification', {
        body: { title: title.trim(), body: body.trim() },
      });

      if (error) throw error;

      setLastResult(data);
      toast({
        title: isRTL ? 'تم الإرسال ✅' : 'Sent ✅',
        description: isRTL
          ? `تم إرسال الإشعار إلى ${data.sent} جهاز (${data.users} مستخدم)`
          : `Notification sent to ${data.sent} devices (${data.users} users)`,
      });
      setTitle('');
      setBody('');
    } catch (err: any) {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="w-5 h-5 text-primary" />
            {isRTL ? 'إرسال إشعار جماعي' : 'Broadcast Notification'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isRTL ? 'أرسل إشعار push لجميع المستخدمين المسجّلين' : 'Send a push notification to all registered users'}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {isRTL ? 'عنوان الإشعار' : 'Notification Title'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isRTL ? 'مثال: تحديث جديد 🚀' : 'e.g. New Update 🚀'}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              {isRTL ? 'محتوى الإشعار' : 'Notification Body'}
            </label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={isRTL ? 'اكتب نص الإشعار هنا...' : 'Write notification text here...'}
              rows={3}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
            className="w-full gap-2"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {sending
              ? (isRTL ? 'جاري الإرسال...' : 'Sending...')
              : (isRTL ? 'إرسال للجميع' : 'Send to All')}
          </Button>

          {lastResult && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-profit/10 border border-profit/20">
              <Users className="w-5 h-5 text-profit" />
              <div className="text-sm">
                <p className="font-medium text-profit">
                  {isRTL ? 'آخر إرسال:' : 'Last broadcast:'}
                </p>
                <p className="text-muted-foreground">
                  {isRTL
                    ? `${lastResult.sent} جهاز ناجح · ${lastResult.failed} فاشل · ${lastResult.users} مستخدم`
                    : `${lastResult.sent} devices OK · ${lastResult.failed} failed · ${lastResult.users} users`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
