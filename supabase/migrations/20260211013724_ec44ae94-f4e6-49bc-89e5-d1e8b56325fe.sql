
-- Function to list all public tables dynamically
CREATE OR REPLACE FUNCTION public.list_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
  AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;
