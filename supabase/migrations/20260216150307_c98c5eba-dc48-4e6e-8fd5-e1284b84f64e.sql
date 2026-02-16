
-- Create a generic function to increment view count for analyses and signals
CREATE OR REPLACE FUNCTION public.increment_view_count(p_table_name text, p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF p_table_name = 'analyses' THEN
    UPDATE public.analyses SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_id;
  ELSIF p_table_name = 'signals' THEN
    UPDATE public.signals SET views_count = COALESCE(views_count, 0) + 1 WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;
END;
$function$;
