import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Analysis {
  id: string;
  title: string;
  content: string;
  symbol: string | null;
  asset_type: 'forex' | 'metals' | 'crypto' | null;
  timeframe: 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  visibility: 'free' | 'vip';
  attachments: string[];
  views_count: number;
  likes_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export const useAnalyses = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('analyses')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        toast({
          title: 'خطأ',
          description: fetchError.message,
          variant: 'destructive'
        });
      } else {
        setAnalyses((data as Analysis[]) || []);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (user) {
      fetchAnalyses();
    } else {
      setAnalyses([]);
      setLoading(false);
    }
  }, [user, fetchAnalyses]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('analyses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analyses'
        },
        () => {
          fetchAnalyses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnalyses]);

  const createAnalysis = async (data: Omit<Analysis, 'id' | 'views_count' | 'likes_count' | 'created_at' | 'updated_at'>) => {
    const { error } = await supabase
      .from('analyses')
      .insert(data);

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({ title: 'تم نشر التحليل بنجاح' });
    return true;
  };

  const updateAnalysis = async (id: string, data: Partial<Analysis>) => {
    const { error } = await supabase
      .from('analyses')
      .update(data)
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({ title: 'تم تحديث التحليل' });
    return true;
  };

  const deleteAnalysis = async (id: string) => {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: 'destructive'
      });
      return false;
    }

    toast({ title: 'تم حذف التحليل' });
    return true;
  };

  const likeAnalysis = async (analysisId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('analysis_likes')
      .insert({ analysis_id: analysisId, user_id: user.id });

    return !error;
  };

  const unlikeAnalysis = async (analysisId: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('analysis_likes')
      .delete()
      .eq('analysis_id', analysisId)
      .eq('user_id', user.id);

    return !error;
  };

  return {
    analyses,
    loading,
    error,
    fetchAnalyses,
    createAnalysis,
    updateAnalysis,
    deleteAnalysis,
    likeAnalysis,
    unlikeAnalysis
  };
};
