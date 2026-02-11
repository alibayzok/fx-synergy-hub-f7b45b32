
CREATE TABLE public.test_table_2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.test_table_2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage test_table_2"
ON public.test_table_2
FOR ALL
USING (is_admin());
