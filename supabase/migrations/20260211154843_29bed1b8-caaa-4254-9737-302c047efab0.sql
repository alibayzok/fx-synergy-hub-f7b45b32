
-- Create virtual cards table
CREATE TABLE public.virtual_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  marqeta_card_token TEXT,
  marqeta_user_token TEXT,
  card_last_four TEXT,
  card_status TEXT NOT NULL DEFAULT 'pending',
  card_type TEXT NOT NULL DEFAULT 'virtual',
  nickname TEXT,
  spending_limit NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_cards ENABLE ROW LEVEL SECURITY;

-- Users can view their own cards
CREATE POLICY "Users can view own cards"
ON public.virtual_cards FOR SELECT
USING (auth.uid() = user_id);

-- Users can create cards for themselves
CREATE POLICY "Users can create own cards"
ON public.virtual_cards FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update own cards
CREATE POLICY "Users can update own cards"
ON public.virtual_cards FOR UPDATE
USING (auth.uid() = user_id);

-- Admins full access
CREATE POLICY "Admins can manage all cards"
ON public.virtual_cards FOR ALL
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_virtual_cards_updated_at
BEFORE UPDATE ON public.virtual_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
