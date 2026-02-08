-- جدول متابعة الصفقات
CREATE TABLE public.trade_followers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(trade_id, user_id)
);

-- جدول تعليقات الصفقات
CREATE TABLE public.trade_comments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.trade_comments(id) ON DELETE CASCADE,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مشاركات الصفقات
CREATE TABLE public.trade_shares (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    share_type TEXT NOT NULL, -- 'copy_link', 'telegram', 'whatsapp', 'twitter'
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول لايكات التعليقات على الصفقات
CREATE TABLE public.trade_comment_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.trade_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(comment_id, user_id)
);

-- تفعيل RLS
ALTER TABLE public.trade_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_comment_likes ENABLE ROW LEVEL SECURITY;

-- سياسات trade_followers
CREATE POLICY "Users can view trade followers" ON public.trade_followers
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can follow trades they can access" ON public.trade_followers
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_id AND can_access_trade(t.visibility))
    );

CREATE POLICY "Users can unfollow" ON public.trade_followers
    FOR DELETE USING (auth.uid() = user_id);

-- سياسات trade_comments
CREATE POLICY "Users can view comments on accessible trades" ON public.trade_comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_id AND can_access_trade(t.visibility))
    );

CREATE POLICY "Users can comment on accessible trades" ON public.trade_comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_id AND can_access_trade(t.visibility))
    );

CREATE POLICY "Users can update own comments" ON public.trade_comments
    FOR UPDATE USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can delete own comments" ON public.trade_comments
    FOR DELETE USING (auth.uid() = user_id OR is_admin());

-- سياسات trade_shares
CREATE POLICY "Users can view own shares" ON public.trade_shares
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can share accessible trades" ON public.trade_shares
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (SELECT 1 FROM public.trades t WHERE t.id = trade_id AND can_access_trade(t.visibility))
    );

-- سياسات trade_comment_likes
CREATE POLICY "Users can view comment likes" ON public.trade_comment_likes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like comments" ON public.trade_comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes" ON public.trade_comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at في trade_comments
CREATE TRIGGER update_trade_comments_updated_at
    BEFORE UPDATE ON public.trade_comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger لتحديث likes_count في trade_comments
CREATE OR REPLACE FUNCTION public.update_trade_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.trade_comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.trade_comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_trade_comment_likes_count_trigger
    AFTER INSERT OR DELETE ON public.trade_comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_trade_comment_likes_count();

-- Trigger لتحديث followers_count في trades
CREATE OR REPLACE FUNCTION public.update_trade_followers_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.trades SET followers_count = followers_count + 1 WHERE id = NEW.trade_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.trades SET followers_count = followers_count - 1 WHERE id = OLD.trade_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_trade_followers_count_trigger
    AFTER INSERT OR DELETE ON public.trade_followers
    FOR EACH ROW EXECUTE FUNCTION public.update_trade_followers_count();

-- تفعيل Realtime للجداول
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.trade_followers;