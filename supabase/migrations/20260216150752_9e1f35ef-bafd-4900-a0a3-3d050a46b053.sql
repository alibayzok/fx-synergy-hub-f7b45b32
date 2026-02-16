
-- Create content_views table for unique view tracking
CREATE TABLE public.content_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content_type text NOT NULL, -- 'analyses' or 'signals'
  content_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, content_id)
);

-- Enable RLS
ALTER TABLE public.content_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own views
CREATE POLICY "Users can insert own views"
ON public.content_views FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view own views
CREATE POLICY "Users can view own views"
ON public.content_views FOR SELECT
USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_content_views_lookup ON public.content_views (user_id, content_type, content_id);

-- Replace increment_view_count to only count unique views
CREATE OR REPLACE FUNCTION public.increment_view_count(p_table_name text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN; END IF;

  -- Try to insert a view record; if already exists, do nothing
  INSERT INTO public.content_views (user_id, content_type, content_id)
  VALUES (v_user_id, p_table_name, p_id)
  ON CONFLICT (user_id, content_type, content_id) DO NOTHING;

  -- Only increment if the insert actually happened (new view)
  IF FOUND THEN
    IF p_table_name = 'analyses' THEN
      UPDATE public.analyses SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_id;
    ELSIF p_table_name = 'signals' THEN
      UPDATE public.signals SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_id;
    END IF;
  END IF;
END;
$function$;
