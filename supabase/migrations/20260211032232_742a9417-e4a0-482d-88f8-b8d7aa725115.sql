
-- Create subscription messages table for in-request chat
CREATE TABLE public.subscription_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.vip_subscriptions(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages on their own subscriptions
CREATE POLICY "Users can view own subscription messages"
  ON public.subscription_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.vip_subscriptions
      WHERE id = subscription_messages.subscription_id
      AND user_id = auth.uid()
    ) OR public.is_admin()
  );

-- Users can send messages on their own subscriptions
CREATE POLICY "Users can send messages on own subscriptions"
  ON public.subscription_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (
        SELECT 1 FROM public.vip_subscriptions
        WHERE id = subscription_messages.subscription_id
        AND user_id = auth.uid()
      ) OR public.is_admin()
    )
  );

-- Admins can delete messages
CREATE POLICY "Admins can delete subscription messages"
  ON public.subscription_messages
  FOR DELETE
  USING (public.is_admin());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_messages;
