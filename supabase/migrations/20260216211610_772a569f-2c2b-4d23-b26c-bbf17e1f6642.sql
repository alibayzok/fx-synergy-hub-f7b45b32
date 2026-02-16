
CREATE OR REPLACE FUNCTION public.get_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    c.column_name::text,
    CASE 
      WHEN c.data_type = 'USER-DEFINED' THEN 'public.' || c.udt_name::text
      WHEN c.data_type = 'ARRAY' THEN c.udt_name::text || '[]'
      ELSE c.data_type::text
    END,
    c.is_nullable::text,
    c.column_default::text
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' 
  AND c.table_name = p_table_name
  ORDER BY c.ordinal_position;
$function$;
