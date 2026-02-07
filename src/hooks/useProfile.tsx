import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Profile {
  id: string;
  user_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  language?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive'
        });
        return { error };
      }

      toast({ title: 'Profile updated successfully' });
      await fetchProfile();
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
      return { error };
    }
  };

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile
  };
};
