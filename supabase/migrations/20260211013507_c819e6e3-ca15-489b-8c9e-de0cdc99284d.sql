
-- جدول اختباري فارغ
CREATE TABLE public.test_table (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.test_table ENABLE ROW LEVEL SECURITY;

-- Admin-only access
CREATE POLICY "Only admins can manage test_table"
ON public.test_table
FOR ALL
USING (public.is_admin());
