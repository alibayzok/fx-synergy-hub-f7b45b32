import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { moderateImage, type ModerationResult } from '@/lib/image-moderation';
export type PostVisibility = 'everyone' | 'friends_only' | 'followers_only' | 'nobody';
export type AssetType = 'forex' | 'metals' | 'crypto';
export type Timeframe = 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export interface UserPost {
  id: string;
  user_id: string;
  content: string;
  attachments: string[];
  symbol?: string;
  asset_type?: AssetType;
  timeframe?: Timeframe;
  visibility: PostVisibility;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
  is_liked?: boolean;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id?: string;
  likes_count: number;
  created_at: string;
  profile?: {
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface CreatePostData {
  content: string;
  attachments?: string[];
  symbol?: string;
  asset_type?: AssetType;
  timeframe?: Timeframe;
  visibility?: PostVisibility;
}

export const useUserPosts = (userId?: string) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Fetch posts for a specific user
  const { data: posts = [], isLoading, refetch } = useQuery({
    queryKey: ['user-posts', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      // Get posts
      const { data: postsData, error } = await supabase
        .from('user_posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!postsData) return [];

      // Get profiles for post authors
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      // Check if current user liked each post
      let likedPostIds = new Set<string>();
      if (user) {
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', postsData.map(p => p.id));
        likedPostIds = new Set(likes?.map(l => l.post_id) || []);
      }

      return postsData.map(post => ({
        ...post,
        profile: profileMap.get(post.user_id) || null,
        is_liked: likedPostIds.has(post.id)
      })) as UserPost[];
    },
    enabled: !!userId,
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: CreatePostData) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_posts')
        .insert({
          user_id: user.id,
          content: postData.content,
          attachments: postData.attachments || [],
          symbol: postData.symbol,
          asset_type: postData.asset_type,
          timeframe: postData.timeframe,
          visibility: postData.visibility || 'everyone',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success(t('posts.created', 'تم نشر المنشور بنجاح'));
    },
    onError: (error) => {
      console.error('Error creating post:', error);
      toast.error(t('posts.createError', 'فشل في نشر المنشور'));
    },
  });

  // Delete post mutation
  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('user_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
      toast.success(t('posts.deleted', 'تم حذف المنشور'));
    },
    onError: (error) => {
      console.error('Error deleting post:', error);
      toast.error(t('posts.deleteError', 'فشل في حذف المنشور'));
    },
  });

  // Like/unlike post mutation
  const toggleLikeMutation = useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
  });

  // Check if file is an image
  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  // Upload attachment with moderation
  const uploadAttachment = async (file: File): Promise<string | null> => {
    if (!user) return null;

    // Check for inappropriate content in images
    if (isImageFile(file)) {
      try {
        toast.loading(t('posts.scanningImage', 'جاري فحص الصورة...'), { id: 'image-scan' });
        
        const moderationResult = await moderateImage(file);
        
        toast.dismiss('image-scan');
        
        if (!moderationResult.isAllowed) {
          toast.error(moderationResult.message || t('posts.imageNotAllowed', 'الصورة غير مسموح بها'));
          
          // Log the flagged content for admin review
          await logFlaggedContent(file, moderationResult);
          
          return null;
        }
        
        // If flagged but allowed (e.g., error during scan), still log for manual review
        if (moderationResult.isFlagged) {
          await logFlaggedContent(file, moderationResult);
        }
      } catch (error) {
        toast.dismiss('image-scan');
        console.error('Image moderation error:', error);
        // Continue with upload if moderation fails, but log for manual review
      }
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('post-attachments')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      toast.error(t('posts.uploadError', 'فشل في رفع الملف'));
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-attachments')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  // Log flagged content for admin review
  const logFlaggedContent = async (file: File, result: ModerationResult) => {
    if (!user) return;
    
    try {
      // We'll create a temporary URL for logging purposes
      const tempUrl = URL.createObjectURL(file);
      
      await supabase
        .from('flagged_content')
        .insert({
          content_type: 'post',
          content_id: crypto.randomUUID(), // Temporary ID since post isn't created yet
          user_id: user.id,
          flagged_url: tempUrl,
          flag_reason: result.reason || 'unknown',
          confidence: result.confidence,
        });
      
      URL.revokeObjectURL(tempUrl);
    } catch (error) {
      console.error('Error logging flagged content:', error);
    }
  };

  return {
    posts,
    isLoading,
    refetch,
    createPost: createPostMutation.mutateAsync,
    isCreating: createPostMutation.isPending,
    deletePost: deletePostMutation.mutateAsync,
    isDeleting: deletePostMutation.isPending,
    toggleLike: toggleLikeMutation.mutate,
    uploadAttachment,
  };
};

export const usePostComments = (postId: string) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      // Get comments
      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!commentsData) return [];

      // Get profiles for comment authors
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      return commentsData.map(comment => ({
        ...comment,
        profile: profileMap.get(comment.user_id) || null,
      })) as PostComment[];
    },
    enabled: !!postId,
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post-comments', postId] });
      queryClient.invalidateQueries({ queryKey: ['user-posts'] });
    },
    onError: (error) => {
      console.error('Error adding comment:', error);
      toast.error(t('posts.commentError', 'فشل في إضافة التعليق'));
    },
  });

  return {
    comments,
    isLoading,
    addComment: addCommentMutation.mutateAsync,
    isAddingComment: addCommentMutation.isPending,
  };
};
