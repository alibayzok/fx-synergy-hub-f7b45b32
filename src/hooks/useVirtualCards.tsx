import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface VirtualCard {
  id: string;
  user_id: string;
  marqeta_card_token: string | null;
  marqeta_user_token: string | null;
  card_last_four: string | null;
  card_status: string;
  card_type: string;
  nickname: string | null;
  spending_limit: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function useVirtualCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('virtual_cards')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCards((data as any) || []);
    } catch (err) {
      console.error('Error fetching cards:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const callEdgeFunction = async (action: string, params: Record<string, any> = {}) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const res = await supabase.functions.invoke('marqeta-cards', {
      body: { action, ...params },
    });

    if (res.error) throw res.error;
    return res.data;
  };

  const createCard = async (params: { nickname?: string; spending_limit?: number; first_name?: string; last_name?: string; email?: string }) => {
    setActionLoading(true);
    try {
      const result = await callEdgeFunction('create_card', params);
      toast.success('تم إنشاء البطاقة بنجاح!');
      await fetchCards();
      return result;
    } catch (err: any) {
      toast.error(err.message || 'فشل إنشاء البطاقة');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const freezeCard = async (cardId: string) => {
    setActionLoading(true);
    try {
      await callEdgeFunction('freeze_card', { card_id: cardId });
      toast.success('تم تجميد البطاقة');
      await fetchCards();
    } catch (err: any) {
      toast.error(err.message || 'فشل تجميد البطاقة');
    } finally {
      setActionLoading(false);
    }
  };

  const unfreezeCard = async (cardId: string) => {
    setActionLoading(true);
    try {
      await callEdgeFunction('unfreeze_card', { card_id: cardId });
      toast.success('تم تفعيل البطاقة');
      await fetchCards();
    } catch (err: any) {
      toast.error(err.message || 'فشل تفعيل البطاقة');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelCard = async (cardId: string) => {
    setActionLoading(true);
    try {
      await callEdgeFunction('cancel_card', { card_id: cardId });
      toast.success('تم إلغاء البطاقة');
      await fetchCards();
    } catch (err: any) {
      toast.error(err.message || 'فشل إلغاء البطاقة');
    } finally {
      setActionLoading(false);
    }
  };

  const getCardDetails = async (cardId: string) => {
    try {
      return await callEdgeFunction('get_card_details', { card_id: cardId });
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل تفاصيل البطاقة');
      return null;
    }
  };

  const getTransactions = async (cardId: string) => {
    try {
      return await callEdgeFunction('get_transactions', { card_id: cardId });
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل المعاملات');
      return null;
    }
  };

  const requestFundCard = async (cardId: string, amount: number, walletAddress?: string) => {
    if (!user) throw new Error('Not authenticated');
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('service_requests')
        .insert({
          user_id: user.id,
          type: 'card_fund' as any,
          amount,
          wallet_address: walletAddress || null,
          notes: `card_id:${cardId}`,
          payment_method: 'USDT',
        });
      if (error) throw error;
      toast.success('تم إرسال طلب شحن البطاقة بنجاح! سيتم مراجعته من قبل الإدارة');
      return true;
    } catch (err: any) {
      toast.error(err.message || 'فشل إرسال طلب الشحن');
      throw err;
    } finally {
      setActionLoading(false);
    }
  };

  const getBalance = async (cardId: string) => {
    try {
      return await callEdgeFunction('get_balance', { card_id: cardId });
    } catch (err: any) {
      toast.error(err.message || 'فشل تحميل الرصيد');
      return null;
    }
  };

  return {
    cards,
    loading,
    actionLoading,
    createCard,
    freezeCard,
    unfreezeCard,
    cancelCard,
    getCardDetails,
    getTransactions,
    requestFundCard,
    getBalance,
    refetch: fetchCards,
  };
}
