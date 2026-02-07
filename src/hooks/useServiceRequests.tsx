import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export type ServiceType = 'broker_deposit' | 'broker_withdraw' | 'usdt_buy' | 'usdt_sell' | 'broker_account';
export type ServiceStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'completed';

export interface ServiceRequest {
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
}

export const useServiceRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data || []) as ServiceRequest[]);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createRequest = async (data: {
    type: ServiceType;
    amount?: number;
    network?: string;
    notes?: string;
  }) => {
    if (!user) return null;

    try {
      const { data: newRequest, error } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          type: data.type,
          amount: data.amount || null,
          network: data.network || null,
          notes: data.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: t('services.requestSubmitted'),
        description: t('services.requestSubmittedDesc'),
      });

      setRequests(prev => [newRequest as ServiceRequest, ...prev]);
      return newRequest as ServiceRequest;
    } catch (error) {
      console.error('Error creating service request:', error);
      toast({
        title: t('common.error'),
        description: t('services.requestError'),
        variant: 'destructive',
      });
      return null;
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`service-requests-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setRequests(prev => [payload.new as ServiceRequest, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests(prev =>
              prev.map(r => (r.id === payload.new.id ? payload.new as ServiceRequest : r))
            );
          } else if (payload.eventType === 'DELETE') {
            setRequests(prev => prev.filter(r => r.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    requests,
    loading,
    createRequest,
    fetchRequests,
  };
};
