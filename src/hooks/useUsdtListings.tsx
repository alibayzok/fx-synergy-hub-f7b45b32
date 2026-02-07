import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface UsdtListing {
  id: string;
  created_by: string;
  listing_type: 'buy' | 'sell';
  price: number;
  commission: number;
  min_amount: number | null;
  max_amount: number | null;
  payment_methods: string[];
  contact_info: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUsdtListingData {
  listing_type: 'buy' | 'sell';
  price: number;
  commission: number;
  min_amount?: number;
  max_amount?: number;
  payment_methods: string[];
  contact_info: string;
  notes?: string;
}

export const useUsdtListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<UsdtListing[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('usdt_listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type assertion since Supabase types may not be updated yet
      setListings((data as unknown as UsdtListing[]) || []);
    } catch (error) {
      console.error('Error fetching USDT listings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createListing = async (data: CreateUsdtListingData) => {
    if (!user) return null;

    try {
      const { data: listing, error } = await supabase
        .from('usdt_listings')
        .insert({
          ...data,
          created_by: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'تم إنشاء الإعلان بنجاح' });
      await fetchListings();
      return listing;
    } catch (error) {
      console.error('Error creating USDT listing:', error);
      toast({ title: 'حدث خطأ في إنشاء الإعلان', variant: 'destructive' });
      return null;
    }
  };

  const updateListing = async (id: string, updates: Partial<CreateUsdtListingData & { is_active: boolean }>) => {
    try {
      const { error } = await supabase
        .from('usdt_listings')
        .update(updates as any)
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'تم تحديث الإعلان' });
      await fetchListings();
    } catch (error) {
      console.error('Error updating USDT listing:', error);
      toast({ title: 'حدث خطأ في التحديث', variant: 'destructive' });
    }
  };

  const deleteListing = async (id: string) => {
    try {
      const { error } = await supabase
        .from('usdt_listings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({ title: 'تم حذف الإعلان' });
      setListings(prev => prev.filter(l => l.id !== id));
    } catch (error) {
      console.error('Error deleting USDT listing:', error);
      toast({ title: 'حدث خطأ في الحذف', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('usdt-listings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'usdt_listings' },
        () => fetchListings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchListings]);

  return {
    listings,
    loading,
    fetchListings,
    createListing,
    updateListing,
    deleteListing,
  };
};
