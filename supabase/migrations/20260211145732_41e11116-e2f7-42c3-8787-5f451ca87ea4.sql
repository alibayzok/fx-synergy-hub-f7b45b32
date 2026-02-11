
-- Dynamic Services table
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT 'Briefcase',
  color text NOT NULL DEFAULT '#3b82f6',
  link_url text DEFAULT '',
  link_label_ar text DEFAULT 'المزيد',
  link_label_en text DEFAULT 'More',
  is_active boolean NOT NULL DEFAULT true,
  is_external_link boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.services
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (is_admin());

-- Brokers table
CREATE TABLE public.brokers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_ar text NOT NULL DEFAULT '',
  logo_url text DEFAULT '',
  registration_url text NOT NULL DEFAULT '',
  description_ar text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  features_ar text[] NOT NULL DEFAULT '{}',
  features_en text[] NOT NULL DEFAULT '{}',
  stats jsonb NOT NULL DEFAULT '[]',
  color text NOT NULL DEFAULT '#f59e0b',
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.brokers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active brokers" ON public.brokers
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage brokers" ON public.brokers
  FOR ALL USING (is_admin());

-- Triggers for updated_at
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brokers_updated_at BEFORE UPDATE ON public.brokers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default broker (OneRoyal)
INSERT INTO public.brokers (name, name_ar, registration_url, description_ar, description_en, features_ar, features_en, stats, color, is_featured)
VALUES (
  'OneRoyal', 'ون رويال',
  'https://www.oneroyal.com',
  'وسيط تداول عالمي مرخص يقدم أفضل شروط التداول',
  'Licensed global broker offering the best trading conditions',
  ARRAY['بونص ترحيبي', 'سحب سريع', 'حساب إسلامي', 'دعم عربي', 'تنفيذ فوري'],
  ARRAY['Welcome bonus', 'Fast withdrawal', 'Islamic account', 'Arabic support', 'Instant execution'],
  '[{"label_ar":"سبريد","label_en":"Spread","value":"0.0"},{"label_ar":"رافعة","label_en":"Leverage","value":"1:500"},{"label_ar":"منصات","label_en":"Platforms","value":"MT4/MT5"},{"label_ar":"دعم","label_en":"Support","value":"24/7"}]'::jsonb,
  '#f59e0b',
  true
);
