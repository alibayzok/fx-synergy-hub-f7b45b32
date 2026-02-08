-- جدول التحليلات
CREATE TABLE public.analyses (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    symbol TEXT,
    asset_type public.asset_type,
    timeframe public.timeframe DEFAULT 'H4',
    visibility public.trade_visibility NOT NULL DEFAULT 'free',
    attachments TEXT[] DEFAULT '{}',
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول لايكات التحليلات
CREATE TABLE public.analysis_likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(analysis_id, user_id)
);

-- تفعيل RLS
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_likes ENABLE ROW LEVEL SECURITY;

-- سياسات analyses
CREATE POLICY "Users can view analyses based on visibility" ON public.analyses
    FOR SELECT USING (can_access_trade(visibility));

CREATE POLICY "Only admins can insert analyses" ON public.analyses
    FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Only admins can update analyses" ON public.analyses
    FOR UPDATE USING (is_admin());

CREATE POLICY "Only admins can delete analyses" ON public.analyses
    FOR DELETE USING (is_admin());

-- سياسات analysis_likes
CREATE POLICY "Users can view analysis likes" ON public.analysis_likes
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like analyses" ON public.analysis_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes" ON public.analysis_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger لتحديث updated_at
CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON public.analyses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger لتحديث likes_count
CREATE OR REPLACE FUNCTION public.update_analysis_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.analyses SET likes_count = likes_count + 1 WHERE id = NEW.analysis_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.analyses SET likes_count = likes_count - 1 WHERE id = OLD.analysis_id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_analysis_likes_count_trigger
    AFTER INSERT OR DELETE ON public.analysis_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_analysis_likes_count();

-- تفعيل Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.analyses;