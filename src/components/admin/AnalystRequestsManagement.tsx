import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, Check, X, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

export const AnalystRequestsManagement = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['admin-analyst-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('approved_analysts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = data?.map(r => r.user_id) || [];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return data.map(r => ({
        ...r,
        profile: profileMap.get(r.user_id) || null,
      }));
    },
  });

  const handleAction = async (id: string, userId: string, status: 'approved' | 'rejected') => {
    const notes = adminNotes[id] || null;
    const { error } = await supabase
      .from('approved_analysts')
      .update({
        status,
        admin_notes: notes,
        reviewed_by: (await supabase.auth.getUser()).data.user?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      toast.error('فشل في تحديث الطلب');
      return;
    }

    toast.success(status === 'approved'
      ? (isArabic ? 'تمت الموافقة ✅' : 'Approved ✅')
      : (isArabic ? 'تم الرفض' : 'Rejected')
    );
    queryClient.invalidateQueries({ queryKey: ['admin-analyst-requests'] });
  };

  const handleDelete = async (id: string) => {
    await supabase.from('approved_analysts').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['admin-analyst-requests'] });
    toast.success(isArabic ? 'تم الحذف' : 'Deleted');
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 gap-1"><Clock className="w-3 h-3" />{isArabic ? 'معلق' : 'Pending'}</Badge>;
      case 'approved': return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1"><Check className="w-3 h-3" />{isArabic ? 'موافق' : 'Approved'}</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><X className="w-3 h-3" />{isArabic ? 'مرفوض' : 'Rejected'}</Badge>;
      default: return null;
    }
  };

  const pending = requests.filter(r => r.status === 'pending');
  const others = requests.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div>
          <h2 className="text-lg font-bold">{isArabic ? 'طلبات المحللين' : 'Analyst Requests'}</h2>
          <p className="text-xs text-muted-foreground">
            {isArabic ? 'إدارة طلبات الانضمام كمحلل معتمد' : 'Manage analyst approval requests'}
          </p>
        </div>
        {pending.length > 0 && (
          <Badge className="bg-amber-500 text-white ms-auto">{pending.length} {isArabic ? 'معلق' : 'pending'}</Badge>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : requests.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">{isArabic ? 'لا توجد طلبات' : 'No requests'}</p>
      ) : (
        <div className="space-y-3">
          {[...pending, ...others].map(req => (
            <div key={req.id} className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {(req.profile?.display_name || '?')[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">
                    {req.profile?.display_name || req.profile?.username || 'Unknown'}
                  </span>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDistanceToNow(new Date(req.created_at), { addSuffix: true, locale: isArabic ? ar : enUS })}
                  </p>
                </div>
                {statusBadge(req.status)}
              </div>

              {req.message && (
                <div className="flex gap-2 items-start p-3 rounded-lg bg-muted/50">
                  <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{req.message}</p>
                </div>
              )}

              {req.status === 'pending' && (
                <div className="space-y-2">
                  <Textarea
                    value={adminNotes[req.id] || ''}
                    onChange={e => setAdminNotes(prev => ({ ...prev, [req.id]: e.target.value }))}
                    placeholder={isArabic ? 'ملاحظات الأدمن (اختياري)...' : 'Admin notes (optional)...'}
                    className="min-h-[60px] resize-none text-xs"
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(req.id, req.user_id, 'approved')}
                      className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Check className="w-4 h-4" /> {isArabic ? 'موافقة' : 'Approve'}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleAction(req.id, req.user_id, 'rejected')}
                      className="flex-1 gap-1.5"
                    >
                      <X className="w-4 h-4" /> {isArabic ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}

              {req.status !== 'pending' && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDelete(req.id)}>
                    {isArabic ? 'حذف' : 'Delete'}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
