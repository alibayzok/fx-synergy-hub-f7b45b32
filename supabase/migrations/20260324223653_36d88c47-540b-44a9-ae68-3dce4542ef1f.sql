
-- Add SLA columns to support_tickets
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS sla_deadline timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sla_breached boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS first_response_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS sla_notified boolean DEFAULT false;

-- Function to auto-set SLA deadline based on priority when ticket is created
CREATE OR REPLACE FUNCTION public.set_sla_deadline()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Set SLA deadline based on priority
  NEW.sla_deadline := CASE NEW.priority
    WHEN 'urgent' THEN NEW.created_at + interval '30 minutes'
    WHEN 'high' THEN NEW.created_at + interval '1 hour'
    WHEN 'normal' THEN NEW.created_at + interval '4 hours'
    WHEN 'low' THEN NEW.created_at + interval '24 hours'
    ELSE NEW.created_at + interval '4 hours'
  END;
  RETURN NEW;
END;
$$;

-- Trigger on INSERT
CREATE TRIGGER trg_set_sla_deadline
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_sla_deadline();

-- Function to recalculate SLA when priority changes
CREATE OR REPLACE FUNCTION public.update_sla_on_priority_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.priority IS DISTINCT FROM NEW.priority AND NEW.status = 'open' AND NOT COALESCE(NEW.sla_breached, false) THEN
    NEW.sla_deadline := CASE NEW.priority
      WHEN 'urgent' THEN now() + interval '30 minutes'
      WHEN 'high' THEN now() + interval '1 hour'
      WHEN 'normal' THEN now() + interval '4 hours'
      WHEN 'low' THEN now() + interval '24 hours'
      ELSE now() + interval '4 hours'
    END;
    NEW.sla_notified := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_sla_on_priority
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sla_on_priority_change();

-- Function to record first response time
CREATE OR REPLACE FUNCTION public.record_first_response()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_admin = true THEN
    UPDATE public.support_tickets
    SET first_response_at = now()
    WHERE id = NEW.ticket_id
    AND first_response_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_record_first_response
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.record_first_response();
