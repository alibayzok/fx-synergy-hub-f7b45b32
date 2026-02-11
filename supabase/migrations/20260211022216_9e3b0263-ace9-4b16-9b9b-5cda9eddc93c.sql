
DROP POLICY IF EXISTS "Only admins can manage test_table" ON public.test_table;
DROP TABLE IF EXISTS public.test_table;

DROP POLICY IF EXISTS "Only admins can manage test_table_2" ON public.test_table_2;
DROP TABLE IF EXISTS public.test_table_2;
