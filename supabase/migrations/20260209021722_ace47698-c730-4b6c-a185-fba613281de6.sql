-- Create post visibility enum
CREATE TYPE public.post_visibility AS ENUM ('everyone', 'friends_only', 'followers_only', 'nobody');

-- Create user_posts table
CREATE TABLE public.user_posts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}'::TEXT[],
    symbol TEXT,
    asset_type public.asset_type,
    timeframe public.timeframe,
    visibility public.post_visibility NOT NULL DEFAULT 'everyone',
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create post_likes table
CREATE TABLE public.post_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(post_id, user_id)
);

-- Create post_comments table
CREATE TABLE public.post_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.user_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.post_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can view post
CREATE OR REPLACE FUNCTION public.can_view_post(post_user_id UUID, post_visibility post_visibility)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Owner can always see their own posts
    IF auth.uid() = post_user_id THEN
        RETURN TRUE;
    END IF;
    
    -- Admins can see all posts
    IF public.is_admin() THEN
        RETURN TRUE;
    END IF;
    
    -- Check visibility
    CASE post_visibility
        WHEN 'everyone' THEN
            RETURN TRUE;
        WHEN 'nobody' THEN
            RETURN FALSE;
        WHEN 'friends_only' THEN
            RETURN public.are_friends(auth.uid(), post_user_id);
        WHEN 'followers_only' THEN
            RETURN EXISTS (
                SELECT 1 FROM public.follows
                WHERE follower_id = auth.uid() AND following_id = post_user_id
            );
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- RLS Policies for user_posts

-- Users can view posts based on visibility
CREATE POLICY "Users can view posts based on visibility"
ON public.user_posts FOR SELECT
USING (can_view_post(user_id, visibility));

-- Users can create their own posts
CREATE POLICY "Users can create own posts"
ON public.user_posts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
ON public.user_posts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
ON public.user_posts FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- RLS Policies for post_likes

-- Users can view likes on visible posts
CREATE POLICY "Users can view post likes"
ON public.post_likes FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.user_posts p
    WHERE p.id = post_id AND can_view_post(p.user_id, p.visibility)
));

-- Users can like posts they can view
CREATE POLICY "Users can like posts"
ON public.post_likes FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.user_posts p
        WHERE p.id = post_id AND can_view_post(p.user_id, p.visibility)
    )
);

-- Users can remove their own likes
CREATE POLICY "Users can remove own likes"
ON public.post_likes FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for post_comments

-- Users can view comments on visible posts
CREATE POLICY "Users can view post comments"
ON public.post_comments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.user_posts p
    WHERE p.id = post_id AND can_view_post(p.user_id, p.visibility)
));

-- Users can comment on posts they can view
CREATE POLICY "Users can comment on posts"
ON public.post_comments FOR INSERT
WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
        SELECT 1 FROM public.user_posts p
        WHERE p.id = post_id AND can_view_post(p.user_id, p.visibility)
    )
);

-- Users can update own comments
CREATE POLICY "Users can update own comments"
ON public.post_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete own comments
CREATE POLICY "Users can delete own comments"
ON public.post_comments FOR DELETE
USING (auth.uid() = user_id OR public.is_admin());

-- Trigger to update likes_count
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.user_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.user_posts SET likes_count = likes_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER update_post_likes_count_trigger
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_post_likes_count();

-- Trigger to update comments_count
CREATE OR REPLACE FUNCTION public.update_post_comments_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.user_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.user_posts SET comments_count = comments_count - 1 WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER update_post_comments_count_trigger
AFTER INSERT OR DELETE ON public.post_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_post_comments_count();

-- Trigger to update updated_at
CREATE TRIGGER update_user_posts_updated_at
BEFORE UPDATE ON public.user_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for post attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-attachments', 'post-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for post attachments
CREATE POLICY "Anyone can view post attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-attachments');

CREATE POLICY "Authenticated users can upload post attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'post-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete own post attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'post-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Enable realtime for posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_posts;