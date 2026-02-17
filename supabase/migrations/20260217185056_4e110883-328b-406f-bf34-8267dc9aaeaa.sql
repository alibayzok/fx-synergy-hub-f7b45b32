
-- Add views_count to room_messages
ALTER TABLE public.room_messages ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- Table for tracking unique views per message
CREATE TABLE public.room_message_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id)
);

ALTER TABLE public.room_message_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own views" ON public.room_message_views
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can read views" ON public.room_message_views
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Table for emoji reactions on messages
CREATE TABLE public.room_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.room_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

ALTER TABLE public.room_message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can add reactions" ON public.room_message_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions" ON public.room_message_reactions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can view reactions" ON public.room_message_reactions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Trigger to increment views_count on room_messages
CREATE OR REPLACE FUNCTION public.increment_room_message_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.room_messages
  SET views_count = views_count + 1
  WHERE id = NEW.message_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_increment_room_message_views
AFTER INSERT ON public.room_message_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_room_message_views();
