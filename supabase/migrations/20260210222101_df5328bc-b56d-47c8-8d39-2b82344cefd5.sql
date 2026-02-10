
-- 1. Create support_agents table (separate from roles, a user can be both agent and have other roles)
CREATE TABLE public.support_agents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is support agent
CREATE OR REPLACE FUNCTION public.is_support_agent(p_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.support_agents
        WHERE user_id = p_user_id AND is_active = true
    ) OR public.is_admin()
$$;

-- RLS for support_agents
CREATE POLICY "Admins can manage support agents" ON public.support_agents
    FOR ALL USING (is_admin());

CREATE POLICY "Agents can view themselves" ON public.support_agents
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Add attachments column to support_messages
ALTER TABLE public.support_messages ADD COLUMN attachments text[] DEFAULT '{}'::text[];

-- 3. Update support_tickets RLS to include support agents
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users and agents can view tickets" ON public.support_tickets
    FOR SELECT USING (auth.uid() = user_id OR is_support_agent());

DROP POLICY IF EXISTS "Admins can update tickets" ON public.support_tickets;
CREATE POLICY "Owners and agents can update tickets" ON public.support_tickets
    FOR UPDATE USING (is_support_agent() OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can delete tickets" ON public.support_tickets;
CREATE POLICY "Agents can delete tickets" ON public.support_tickets
    FOR DELETE USING (is_support_agent());

-- 4. Update support_messages RLS to include support agents
DROP POLICY IF EXISTS "Users can view messages of own tickets" ON public.support_messages;
CREATE POLICY "Users and agents can view messages" ON public.support_messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR is_support_agent()))
    );

DROP POLICY IF EXISTS "Users can send messages on own tickets" ON public.support_messages;
CREATE POLICY "Users and agents can send messages" ON public.support_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR is_support_agent()))
    );

DROP POLICY IF EXISTS "Admins can delete messages" ON public.support_messages;
CREATE POLICY "Agents can delete messages" ON public.support_messages
    FOR DELETE USING (is_support_agent() OR auth.uid() = sender_id);

-- 5. Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('support-attachments', 'support-attachments', false);

-- Storage policies for support-attachments
CREATE POLICY "Authenticated users can upload support attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'support-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can view support attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'support-attachments' AND auth.uid() IS NOT NULL);

CREATE POLICY "Agents can delete support attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'support-attachments' AND (auth.uid()::text = (storage.foldername(name))[1] OR is_support_agent()));

-- 6. Add assigned_to field on tickets for agent assignment
ALTER TABLE public.support_tickets ADD COLUMN assigned_to uuid NULL;
ALTER TABLE public.support_tickets ADD COLUMN priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));

-- 7. Notify support agents on new ticket
CREATE OR REPLACE FUNCTION public.notify_admin_new_support_ticket()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    user_display_name TEXT;
    agent RECORD;
BEGIN
    SELECT COALESCE(display_name, username, 'مستخدم') INTO user_display_name
    FROM public.profiles WHERE user_id = NEW.user_id;
    
    -- Notify all active support agents
    FOR agent IN SELECT user_id FROM public.support_agents WHERE is_active = true
    LOOP
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            agent.user_id,
            'support_ticket',
            'تذكرة دعم جديدة 🎫',
            user_display_name || ': ' || LEFT(NEW.subject, 50),
            jsonb_build_object('ticket_id', NEW.id, 'user_id', NEW.user_id)
        );
    END LOOP;
    
    -- Also notify admins
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
