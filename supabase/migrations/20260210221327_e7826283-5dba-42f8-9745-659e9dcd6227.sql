
-- Create support tickets table
CREATE TABLE public.support_tickets (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    subject text NOT NULL,
    status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create support messages table
CREATE TABLE public.support_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL,
    is_admin boolean NOT NULL DEFAULT false,
    content text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create tickets" ON public.support_tickets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update tickets" ON public.support_tickets
    FOR UPDATE USING (is_admin() OR auth.uid() = user_id);

CREATE POLICY "Admins can delete tickets" ON public.support_tickets
    FOR DELETE USING (is_admin());

-- RLS for support_messages
CREATE POLICY "Users can view messages of own tickets" ON public.support_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR is_admin()))
    );

CREATE POLICY "Users can send messages on own tickets" ON public.support_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR is_admin()))
    );

CREATE POLICY "Admins can delete messages" ON public.support_messages
    FOR DELETE USING (is_admin());

-- Trigger to update ticket updated_at
CREATE TRIGGER update_support_tickets_updated_at
    BEFORE UPDATE ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;

-- Notify admin on new ticket
CREATE OR REPLACE FUNCTION public.notify_admin_new_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_display_name TEXT;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    INSERT INTO public.admin_notifications (type, title, message, data)
    VALUES (
        'support_ticket',
        'تذكرة دعم جديدة 🎫',
        user_display_name || ' أرسل تذكرة دعم: ' || LEFT(NEW.subject, 50),
        jsonb_build_object('ticket_id', NEW.id, 'user_id', NEW.user_id, 'subject', NEW.subject)
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_support_ticket
    AFTER INSERT ON public.support_tickets
    FOR EACH ROW EXECUTE FUNCTION public.notify_admin_new_support_ticket();
