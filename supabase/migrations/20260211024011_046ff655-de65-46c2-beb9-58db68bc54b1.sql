
-- Create content_type enum for signals
CREATE TYPE public.signal_type AS ENUM ('signal', 'tip');

-- Create signals table
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  symbol TEXT,
  asset_type public.asset_type,
  timeframe public.timeframe DEFAULT 'H4',
  attachments TEXT[] DEFAULT '{}',
  visibility public.content_visibility NOT NULL DEFAULT 'free',
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view signals based on visibility"
ON public.signals FOR SELECT
USING (can_access_content(visibility));

CREATE POLICY "Only admins can insert signals"
ON public.signals FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Only admins can update signals"
ON public.signals FOR UPDATE
USING (is_admin());

CREATE POLICY "Only admins can delete signals"
ON public.signals FOR DELETE
USING (is_admin());

-- Signal likes table
CREATE TABLE public.signal_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  signal_id UUID NOT NULL REFERENCES public.signals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(signal_id, user_id)
);

ALTER TABLE public.signal_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signal likes"
ON public.signal_likes FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can like signals"
ON public.signal_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own likes"
ON public.signal_likes FOR DELETE
USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_signals_updated_at
BEFORE UPDATE ON public.signals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
