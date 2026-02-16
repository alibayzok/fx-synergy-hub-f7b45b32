import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { moderateImage } from '@/lib/image-moderation';

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
  onboarding_completed?: boolean;
  trading_preferences?: any;
  referral_code?: string;
  is_verified?: boolean;
  phone_verified?: boolean;
  kyc_status?: string;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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

      toast({ title: 'تم تحديث الملف الشخصي بنجاح' });
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

  const uploadAvatar = async (file: File): Promise<{ error: Error | null; url?: string }> => {
    if (!user) return { error: new Error('Not authenticated') };

    setUploadingAvatar(true);
    try {
      // Validate file type and size
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'نوع الملف غير مدعوم', description: 'يرجى اختيار صورة بصيغة JPG, PNG, WebP أو GIF', variant: 'destructive' });
        return { error: new Error('Invalid file type') };
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'حجم الملف كبير جداً', description: 'الحد الأقصى 5 ميجابايت', variant: 'destructive' });
        return { error: new Error('File too large') };
      }

      // Moderate image
      const modResult = await moderateImage(file);
      if (!modResult.isAllowed) {
        toast({ title: '🚫 محتوى مخالف', description: modResult.message || 'تم رفض الصورة لاحتوائها على محتوى غير لائق', variant: 'destructive' });
        return { error: new Error('Image rejected by moderation') };
      }

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Delete old avatar first
      await supabase.storage.from('avatars').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast({ title: 'فشل رفع الصورة', description: uploadError.message, variant: 'destructive' });
        return { error: uploadError };
      }

      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) {
        toast({ title: 'فشل تحديث الملف الشخصي', description: updateError.message, variant: 'destructive' });
        return { error: updateError };
      }

      // Flag if moderation flagged it
      if (modResult.isFlagged) {
        await supabase.from('flagged_content').insert({
          user_id: user.id,
          content_type: 'avatar',
          content_id: user.id,
          flag_reason: modResult.reason || 'review',
          confidence: modResult.confidence,
          flagged_url: avatarUrl,
        });
      }

      toast({ title: '✅ تم تحديث الصورة الشخصية بنجاح' });
      await fetchProfile();
      return { error: null, url: avatarUrl };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return { error };
    } finally {
      setUploadingAvatar(false);
    }
  };

  const deleteAvatar = async (): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // List and remove all files in user's avatar folder
      const { data: files } = await supabase.storage.from('avatars').list(user.id);
      if (files && files.length > 0) {
        const paths = files.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('avatars').remove(paths);
      }

      // Clear avatar_url in profile
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', user.id);

      if (error) {
        toast({ title: 'فشل حذف الصورة', description: error.message, variant: 'destructive' });
        return { error };
      }

      toast({ title: '✅ تم حذف الصورة الشخصية' });
      await fetchProfile();
      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      return { error };
    }
  };

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    uploadAvatar,
    uploadingAvatar,
    deleteAvatar
  };
};
