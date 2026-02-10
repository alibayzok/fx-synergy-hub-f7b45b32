
CREATE OR REPLACE FUNCTION public.close_stale_support_tickets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    closed_count integer;
BEGIN
    UPDATE public.support_tickets
    SET status = 'closed', updated_at = now()
    WHERE status = 'open'
    AND updated_at < now() - interval '4 hours';
    
    GET DIAGNOSTICS closed_count = ROW_COUNT;
    RETURN closed_count;
END;
$$;
