import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AppSetting {
  id: string;
  category: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  label_ar: string;
  label_en: string;
  description_ar: string | null;
  sort_order: number;
  updated_at: string;
}

interface AppSettingsContextType {
  settings: Record<string, string>;
  allSettings: AppSetting[];
  loading: boolean;
  getSetting: (key: string, defaultValue?: string) => string;
  getBoolean: (key: string, defaultValue?: boolean) => boolean;
  refetch: () => Promise<void>;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [allSettings, setAllSettings] = useState<AppSetting[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      const mapped: Record<string, string> = {};
      data.forEach((s: any) => {
        mapped[s.setting_key] = s.setting_value || '';
      });
      setSettings(mapped);
      setAllSettings(data as AppSetting[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('app-settings-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => {
        fetchSettings();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchSettings]);

  const getSetting = useCallback((key: string, defaultValue = '') => {
    return settings[key] || defaultValue;
  }, [settings]);

  const getBoolean = useCallback((key: string, defaultValue = false) => {
    const val = settings[key];
    if (val === undefined || val === '') return defaultValue;
    return val === 'true';
  }, [settings]);

  return (
    <AppSettingsContext.Provider value={{ settings, allSettings, loading, getSetting, getBoolean, refetch: fetchSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    // Fallback for components outside provider
    return {
      settings: {} as Record<string, string>,
      allSettings: [] as AppSetting[],
      loading: false,
      getSetting: (_key: string, defaultValue = '') => defaultValue,
      getBoolean: (_key: string, defaultValue = false) => defaultValue,
      refetch: async () => {},
    };
  }
  return ctx;
};
