import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Clock, CheckCircle, XCircle, AlertCircle, MessageSquare,
  User, DollarSign, Briefcase, Send, ClipboardList, Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ServiceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';
type ServiceType = 'broker_deposit' | 'broker_withdraw' | 'usdt_buy' | 'usdt_sell' | 'broker_account';

interface ServiceRequest {
  id: string;
  user_id: string;
  type: ServiceType;
  amount: number | null;
  network: string | null;
  status: ServiceStatus;
  notes: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  user_profile?: {
    display_name: string | null;
    phone: string | null;
  };
}

const statusConfig: Record<ServiceStatus, { icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
  in_progress: { icon: AlertCircle, color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
  approved: { icon: CheckCircle, color: 'text-profit', bgColor: 'bg-profit/10' },
  rejected: { icon: XCircle, color: 'text-loss', bgColor: 'bg-loss/10' },
  completed: { icon: CheckCircle, color: 'text-profit', bgColor: 'bg-profit/10' },
};

const typeConfig: Record<ServiceType, { icon: typeof DollarSign; color: string }> = {
  broker_deposit: { icon: Briefcase, color: 'text-emerald-400' },
  broker_withdraw: { icon: Briefcase, color: 'text-orange-400' },
  broker_account: { icon: Briefcase, color: 'text-amber-400' },
  usdt_buy: { icon: DollarSign, color: 'text-profit' },
  usdt_sell: { icon: DollarSign, color: 'text-loss' },
};

export const ServiceRequestsManagement = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';
  
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ServiceStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);
  const [filter, setFilter] = useState<'all' | ServiceStatus>('all');

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const { data: requestsData, error } = await supabase
        .from('service_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const userIds = [...new Set((requestsData || []).map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, phone')
        .in('user_id', userIds);

      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, { display_name: p.display_name, phone: p.phone }])
      );

      const enrichedRequests = (requestsData || []).map(r => ({
        ...r,
        user_profile: profilesMap.get(r.user_id) || { display_name: null, phone: null }
      })) as ServiceRequest[];

      setRequests(enrichedRequests);
    } catch (error) {
      console.error('Error fetching service requests:', error);
      toast({ title: t('common.error'), description: 'Failed to load service requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-service-requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => { fetchRequests(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchRequests]);

  const handleOpenDetail = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setAdminNotes(request.admin_notes || '');
    setShowDetailDialog(true);
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus, admin_notes: adminNotes || null })
        .eq('id', selectedRequest.id);
      if (error) throw error;

      await supabase.from('user_notifications').insert({
        user_id: selectedRequest.user_id,
        type: 'service_update',
        title: t('services.requestUpdated'),
        message: t(`services.${newStatus}`),
        data: { request_id: selectedRequest.id, type: selectedRequest.type, status: newStatus }
      });

      toast({ title: t('admin.requestUpdated'), description: t('admin.requestUpdatedDesc') });
      setShowDetailDialog(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({ title: t('common.error'), description: 'Failed to update request', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Premium Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-orange-500/15 via-orange-600/5 to-transparent border border-orange-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-orange-500/20 border border-orange-500/20">
              <ClipboardList className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                {t('admin.serviceRequests')}
                {pendingCount > 0 && (
                  <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 rounded-lg">
                    {pendingCount} معلقة
                  </Badge>
                )}
              </h2>
              <p className="text-xs text-muted-foreground/70">{requests.length} طلب إجمالي</p>
            </div>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-[130px] rounded-xl border-border/30 bg-background/50 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('trades.all')}</SelectItem>
              <SelectItem value="pending">{t('services.pending')}</SelectItem>
              <SelectItem value="in_progress">{t('services.in_progress')}</SelectItem>
              <SelectItem value="approved">{t('services.approved')}</SelectItem>
              <SelectItem value="rejected">{t('services.rejected')}</SelectItem>
              <SelectItem value="completed">{t('services.completed')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {filteredRequests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="p-4 rounded-2xl bg-muted/30 mb-4">
            <ClipboardList className="w-10 h-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground font-medium">{t('admin.noServiceRequests')}</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((request, index) => {
            const statusCfg = statusConfig[request.status];
            const typeCfg = typeConfig[request.type];
            const StatusIcon = statusCfg.icon;
            const TypeIcon = typeCfg.icon;

            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.01]",
                  request.status === 'pending' 
                    ? "bg-gradient-to-br from-yellow-500/8 to-transparent border-yellow-500/20" 
                    : "bg-card/50 border-border/25 hover:border-border/40"
                )}
                onClick={() => handleOpenDetail(request)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-2.5 rounded-xl border", statusCfg.bgColor, "border-current/10")}>
                      <TypeIcon className={cn("w-5 h-5", typeCfg.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="rounded-lg">{t(`services.${request.type}`)}</Badge>
                        {request.amount && (
                          <span className="text-sm font-semibold trading-number text-foreground">
                            ${request.amount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{request.user_profile?.display_name || t('admin.unnamed')}</span>
                      </div>
                      {request.network && (
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {t('services.network')}: {request.network}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={cn("flex items-center gap-1 px-2 py-1 rounded-lg", statusCfg.bgColor)}>
                      <StatusIcon className={cn("w-3.5 h-3.5", statusCfg.color)} />
                      <span className={cn("text-xs font-medium", statusCfg.color)}>
                        {t(`services.${request.status}`)}
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60">
                      {new Date(request.created_at).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                    </span>
                  </div>
                </div>
                {request.notes && (
                  <p className="text-sm text-muted-foreground/70 mt-2.5 pt-2.5 border-t border-border/20 line-clamp-1">
                    {request.notes}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{t('admin.requestDetails')}</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/25 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('services.requestType')}</span>
                  <Badge className="rounded-lg">{t(`services.${selectedRequest.type}`)}</Badge>
                </div>
                {selectedRequest.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('services.amount')}</span>
                    <span className="font-semibold trading-number">${selectedRequest.amount}</span>
                  </div>
                )}
                {selectedRequest.network && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('services.network')}</span>
                    <span className="font-medium">{selectedRequest.network}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('admin.user')}</span>
                  <span className="font-medium">{selectedRequest.user_profile?.display_name || t('admin.unnamed')}</span>
                </div>
                {selectedRequest.user_profile?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('auth.phone')}</span>
                    <span className="font-medium trading-number">{selectedRequest.user_profile.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('admin.createdAt')}</span>
                  <span className="text-sm">
                    {new Date(selectedRequest.created_at).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                  </span>
                </div>
                {selectedRequest.notes && (
                  <div className="pt-2 border-t border-border/20">
                    <span className="text-sm text-muted-foreground block mb-1">{t('services.notes')}</span>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('services.status')}</label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ServiceStatus)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('services.pending')}</SelectItem>
                    <SelectItem value="in_progress">{t('services.in_progress')}</SelectItem>
                    <SelectItem value="approved">{t('services.approved')}</SelectItem>
                    <SelectItem value="rejected">{t('services.rejected')}</SelectItem>
                    <SelectItem value="completed">{t('services.completed')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {t('admin.adminReply')}
                </label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={t('admin.adminReplyPlaceholder')}
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <Button 
                onClick={handleUpdateRequest} 
                className="w-full gap-2 rounded-xl" 
                disabled={updating}
              >
                <Send className="w-4 h-4" />
                {updating ? t('common.loading') : t('admin.updateRequest')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
