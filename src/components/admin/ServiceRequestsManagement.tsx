import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  MessageSquare,
  User,
  DollarSign,
  Briefcase,
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

      // Fetch user profiles for each request
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
      toast({
        title: t('common.error'),
        description: 'Failed to load service requests',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [t, toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('admin-service-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
        },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
        .update({
          status: newStatus,
          admin_notes: adminNotes || null,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      // Send notification to user about status update
      await supabase
        .from('user_notifications')
        .insert({
          user_id: selectedRequest.user_id,
          type: 'service_update',
          title: t('services.requestUpdated'),
          message: t(`services.${newStatus}`),
          data: {
            request_id: selectedRequest.id,
            type: selectedRequest.type,
            status: newStatus
          }
        });

      toast({
        title: t('admin.requestUpdated'),
        description: t('admin.requestUpdatedDesc'),
      });

      setShowDetailDialog(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: t('common.error'),
        description: 'Failed to update request',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {t('admin.serviceRequests')}
          {pendingCount > 0 && (
            <Badge variant="destructive" className="rounded-full">
              {pendingCount}
            </Badge>
          )}
        </h2>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="w-[140px]">
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

      {filteredRequests.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {t('admin.noServiceRequests')}
        </div>
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
                transition={{ delay: index * 0.05 }}
                className="p-4 rounded-xl bg-card/50 border border-border/30 cursor-pointer hover:bg-card/70 transition-colors"
                onClick={() => handleOpenDetail(request)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      statusCfg.bgColor
                    )}>
                      <TypeIcon className={cn("w-5 h-5", typeCfg.color)} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline">{t(`services.${request.type}`)}</Badge>
                        {request.amount && (
                          <span className="text-sm font-medium trading-number text-foreground">
                            ${request.amount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="w-3 h-3" />
                        <span>{request.user_profile?.display_name || t('admin.unnamed')}</span>
                      </div>
                      {request.network && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t('services.network')}: {request.network}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className={cn("flex items-center gap-1", statusCfg.color)}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {t(`services.${request.status}`)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString(isArabic ? 'ar-SA' : 'en-US')}
                    </span>
                  </div>
                </div>
                {request.notes && (
                  <p className="text-sm text-muted-foreground mt-2 pt-2 border-t border-border/30">
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
              {/* Request Info */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('services.requestType')}</span>
                  <Badge>{t(`services.${selectedRequest.type}`)}</Badge>
                </div>
                {selectedRequest.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('services.amount')}</span>
                    <span className="font-medium trading-number">${selectedRequest.amount}</span>
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
                    {new Date(selectedRequest.created_at).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                  </span>
                </div>
                {selectedRequest.notes && (
                  <div className="pt-2 border-t border-border/30">
                    <span className="text-sm text-muted-foreground block mb-1">{t('services.notes')}</span>
                    <p className="text-sm">{selectedRequest.notes}</p>
                  </div>
                )}
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('services.status')}</label>
                <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ServiceStatus)}>
                  <SelectTrigger>
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

              {/* Admin Notes */}
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
                />
              </div>

              <Button 
                onClick={handleUpdateRequest} 
                className="w-full gap-2" 
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
