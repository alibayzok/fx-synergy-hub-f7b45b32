import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldCheck, CheckCircle2, XCircle, Clock, Eye, Loader2, FileCheck, Phone, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface VerificationRequest {
  id: string;
  user_id: string;
  document_type: string;
  document_front_url: string;
  document_back_url?: string;
  selfie_url: string;
  status: string;
  rejection_reason?: string;
  created_at: string;
  profile?: { display_name?: string; username?: string; avatar_url?: string; phone?: string };
}

export const VerificationManagement = () => {
  const { i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = i18n.language === 'ar';
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    let query = supabase
      .from('verification_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('status', 'pending');
    }

    const { data, error } = await query;
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Fetch profiles for these users
    const userIds = [...new Set((data || []).map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, username, avatar_url, phone')
      .in('user_id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
    const enriched = (data || []).map(r => ({ ...r, profile: profileMap.get(r.user_id) }));
    setRequests(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [filter]);

  const handleApprove = async (req: VerificationRequest) => {
    setProcessing(true);
    try {
      await supabase
        .from('verification_requests')
        .update({ status: 'approved', reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      if (req.document_type === 'phone_verification') {
        await supabase.rpc('verify_user_phone', { p_user_id: req.user_id, p_verified: true });
      } else {
        await supabase.rpc('update_kyc_status', { p_user_id: req.user_id, p_status: 'approved' });
      }

      toast({ title: isRTL ? 'تمت الموافقة ✅' : 'Approved ✅' });
      setSelectedRequest(null);
      fetchRequests();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (req: VerificationRequest) => {
    setProcessing(true);
    try {
      await supabase
        .from('verification_requests')
        .update({ status: 'rejected', rejection_reason: rejectionReason, reviewed_at: new Date().toISOString() })
        .eq('id', req.id);

      if (req.document_type === 'phone_verification') {
        // no status change needed
      } else {
        await supabase.rpc('update_kyc_status', { p_user_id: req.user_id, p_status: 'rejected' });
      }

      toast({ title: isRTL ? 'تم الرفض' : 'Rejected' });
      setSelectedRequest(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const getDocTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_card: isRTL ? 'بطاقة هوية' : 'ID Card',
      passport: isRTL ? 'جواز سفر' : 'Passport',
      driver_license: isRTL ? 'رخصة قيادة' : "Driver's License",
      phone_verification: isRTL ? 'توثيق هاتف' : 'Phone Verification',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-500/15 text-amber-500 border-amber-500/30 gap-1"><Clock className="w-3 h-3" />{isRTL ? 'معلق' : 'Pending'}</Badge>;
      case 'approved': return <Badge className="bg-emerald-500/15 text-emerald-500 border-emerald-500/30 gap-1"><CheckCircle2 className="w-3 h-3" />{isRTL ? 'موافق' : 'Approved'}</Badge>;
      case 'rejected': return <Badge className="bg-destructive/15 text-destructive border-destructive/30 gap-1"><XCircle className="w-3 h-3" />{isRTL ? 'مرفوض' : 'Rejected'}</Badge>;
      default: return null;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-500/15 via-blue-600/5 to-transparent border border-blue-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/20 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{isRTL ? 'طلبات التوثيق' : 'Verification Requests'}</h2>
              <p className="text-xs text-muted-foreground/70">{pendingCount} {isRTL ? 'طلب معلق' : 'pending'}</p>
            </div>
          </div>
          <Sparkles className="w-5 h-5 text-blue-400/40" />
        </div>
      </motion.div>

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setFilter('pending')} className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all", filter === 'pending' ? "bg-primary/15 text-primary border-primary/30" : "bg-card/50 text-muted-foreground border-border/20")}>
          {isRTL ? 'المعلقة' : 'Pending'} ({pendingCount})
        </button>
        <button onClick={() => setFilter('all')} className={cn("px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all", filter === 'all' ? "bg-primary/15 text-primary border-primary/30" : "bg-card/50 text-muted-foreground border-border/20")}>
          {isRTL ? 'الكل' : 'All'} ({requests.length})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-2xl bg-card/50 animate-pulse border border-border/20" />)}</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{isRTL ? 'لا توجد طلبات' : 'No requests'}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((req, i) => (
            <motion.button
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedRequest(req)}
              className="w-full text-start p-4 rounded-2xl border bg-card/50 border-border/20 hover:border-border/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={req.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary text-sm">
                    {req.profile?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground truncate">
                    {req.profile?.display_name || req.profile?.username || req.user_id.slice(0, 8)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground">
                      {req.document_type === 'phone_verification' ? <Phone className="w-3 h-3 inline me-1" /> : <FileCheck className="w-3 h-3 inline me-1" />}
                      {getDocTypeLabel(req.document_type)}
                    </span>
                    <span className="text-[10px] text-muted-foreground/50">
                      {new Date(req.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {getStatusBadge(req.status)}
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={(o) => !o && setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'مراجعة طلب التوثيق' : 'Review Verification Request'}</DialogTitle>
            <DialogDescription>{isRTL ? 'راجع المستندات وقرر' : 'Review documents and decide'}</DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              {/* User info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 border border-border/20">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedRequest.profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedRequest.profile?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selectedRequest.profile?.display_name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{getDocTypeLabel(selectedRequest.document_type)}</p>
                  {selectedRequest.document_type === 'phone_verification' && selectedRequest.profile?.phone && (
                    <p className="text-xs text-primary font-mono mt-0.5">📱 {selectedRequest.profile.phone}</p>
                  )}
                </div>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Documents */}
              {selectedRequest.document_type !== 'phone_verification' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1.5">{isRTL ? 'الوجه الأمامي' : 'Front Side'}</p>
                    <img src={selectedRequest.document_front_url} alt="Front" className="w-full max-h-64 object-contain rounded-xl border border-border/30" />
                  </div>
                  {selectedRequest.document_back_url && selectedRequest.document_back_url !== 'not_required' && (
                    <div>
                      <p className="text-sm font-medium mb-1.5">{isRTL ? 'الوجه الخلفي' : 'Back Side'}</p>
                      <img src={selectedRequest.document_back_url} alt="Back" className="w-full max-h-64 object-contain rounded-xl border border-border/30" />
                    </div>
                  )}
                </div>
              )}

              {/* Actions for pending */}
              {selectedRequest.status === 'pending' && (
                <div className="space-y-3 pt-2">
                  <Textarea
                    placeholder={isRTL ? 'سبب الرفض (اختياري)' : 'Rejection reason (optional)'}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="rounded-xl"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={processing}
                      className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      {isRTL ? 'موافقة' : 'Approve'}
                    </Button>
                    <Button
                      onClick={() => handleReject(selectedRequest)}
                      disabled={processing}
                      variant="destructive"
                      className="flex-1 gap-2"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {isRTL ? 'رفض' : 'Reject'}
                    </Button>
                  </div>
                </div>
              )}

              {/* Rejection reason display */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{isRTL ? 'سبب الرفض:' : 'Rejection reason:'}</p>
                  <p className="text-sm text-foreground mt-1">{selectedRequest.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
