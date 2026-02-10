
-- Add escalation columns to support_tickets
ALTER TABLE public.support_tickets 
ADD COLUMN IF NOT EXISTS escalated_to uuid DEFAULT NULL,
ADD COLUMN IF NOT EXISTS escalation_reason text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS escalated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS escalated_by uuid DEFAULT NULL;

-- Create function to notify on ticket transfer/escalation
CREATE OR REPLACE FUNCTION public.notify_ticket_transfer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    sender_name TEXT;
    ticket_subject TEXT;
    target_user_id UUID;
    action_text TEXT;
BEGIN
    -- Only fire when assigned_to or escalated_to changes
    IF (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to AND NEW.assigned_to IS NOT NULL) OR
       (OLD.escalated_to IS DISTINCT FROM NEW.escalated_to AND NEW.escalated_to IS NOT NULL) THEN
        
        -- Get the name of who did the transfer
        SELECT COALESCE(display_name, username, 'موظف دعم') INTO sender_name
        FROM public.profiles WHERE user_id = COALESCE(NEW.escalated_by, auth.uid());
        
        ticket_subject := NEW.subject;
        
        -- Determine target and action
        IF OLD.escalated_to IS DISTINCT FROM NEW.escalated_to AND NEW.escalated_to IS NOT NULL THEN
            target_user_id := NEW.escalated_to;
            action_text := 'تم تصعيد تذكرة إليك';
        ELSE
            target_user_id := NEW.assigned_to;
            action_text := 'تم تحويل تذكرة إليك';
        END IF;
        
        -- Notify the target
        INSERT INTO public.user_notifications (user_id, type, title, message, data)
        VALUES (
            target_user_id,
            'support_ticket',
            action_text || ' 🎫',
            sender_name || ': ' || LEFT(ticket_subject, 50),
            jsonb_build_object(
                'ticket_id', NEW.id,
                'transferred_by', COALESCE(NEW.escalated_by, auth.uid()),
                'reason', NEW.escalation_reason
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS on_ticket_transfer ON public.support_tickets;
CREATE TRIGGER on_ticket_transfer
AFTER UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_ticket_transfer();
