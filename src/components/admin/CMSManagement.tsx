import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Settings, Globe, Type, Link2, ToggleRight, Megaphone,
  Save, Plus, Trash2, Check, X, Palette
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Setting {
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

const CATEGORIES = [
  { key: 'general', label: 'عام', icon: Settings },
  { key: 'texts', label: 'النصوص', icon: Type },
  { key: 'links', label: 'الروابط', icon: Link2 },
  { key: 'features', label: 'الميزات', icon: ToggleRight },
  { key: 'announcements', label: 'الإعلانات', icon: Megaphone },
];

export const CMSManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newSetting, setNewSetting] = useState({
    category: 'general',
    setting_key: '',
    setting_value: '',
    setting_type: 'text',
    label_ar: '',
    label_en: '',
    description_ar: '',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      setSettings(data as Setting[]);
      const vals: Record<string, string> = {};
      data.forEach((s: any) => { vals[s.id] = s.setting_value || ''; });
      setEditedValues(vals);
    }
    setLoading(false);
  };

  const handleSave = async (setting: Setting) => {
    setSaving(setting.id);
    const newValue = editedValues[setting.id];
    
    const { error } = await supabase
      .from('app_settings')
      .update({ 
        setting_value: newValue, 
        updated_at: new Date().toISOString(),
        updated_by: user?.id 
      })
      .eq('id', setting.id);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الحفظ ✅', description: `تم تحديث "${setting.label_ar}"` });
      setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, setting_value: newValue } : s));
    }
    setSaving(null);
  };

  const handleSaveAll = async (category: string) => {
    setSaving('all');
    const categorySettings = settings.filter(s => s.category === category);
    
    for (const setting of categorySettings) {
      const newValue = editedValues[setting.id];
      if (newValue !== (setting.setting_value || '')) {
        await supabase
          .from('app_settings')
          .update({ 
            setting_value: newValue, 
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          })
          .eq('id', setting.id);
      }
    }
    
    toast({ title: 'تم حفظ جميع التغييرات ✅' });
    fetchSettings();
    setSaving(null);
  };

  const handleAddSetting = async () => {
    if (!newSetting.setting_key || !newSetting.label_ar) {
      toast({ title: 'خطأ', description: 'يرجى ملء الحقول المطلوبة', variant: 'destructive' });
      return;
    }

    const maxOrder = settings
      .filter(s => s.category === newSetting.category)
      .reduce((max, s) => Math.max(max, s.sort_order), 0);

    const { error } = await supabase.from('app_settings').insert({
      ...newSetting,
      sort_order: maxOrder + 1,
      updated_by: user?.id,
    });

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تمت الإضافة ✅' });
      setShowAddDialog(false);
      setNewSetting({ category: 'general', setting_key: '', setting_value: '', setting_type: 'text', label_ar: '', label_en: '', description_ar: '' });
      fetchSettings();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('app_settings').delete().eq('id', id);
    if (!error) {
      toast({ title: 'تم الحذف' });
      fetchSettings();
    }
  };

  const hasChanges = (setting: Setting) => {
    return editedValues[setting.id] !== (setting.setting_value || '');
  };

  const renderSettingInput = (setting: Setting) => {
    const value = editedValues[setting.id] ?? '';
    const changed = hasChanges(setting);

    switch (setting.setting_type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-foreground font-medium">{setting.label_ar}</Label>
              {setting.description_ar && (
                <p className="text-xs text-muted-foreground mt-0.5">{setting.description_ar}</p>
              )}
            </div>
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => {
                const newVal = checked ? 'true' : 'false';
                setEditedValues(prev => ({ ...prev, [setting.id]: newVal }));
                // Auto-save booleans
                supabase
                  .from('app_settings')
                  .update({ setting_value: newVal, updated_at: new Date().toISOString(), updated_by: user?.id })
                  .eq('id', setting.id)
                  .then(({ error }) => {
                    if (!error) {
                      setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, setting_value: newVal } : s));
                      toast({ title: `${setting.label_ar}: ${checked ? 'مفعّل' : 'معطّل'}` });
                    }
                  });
              }}
            />
          </div>
        );

      case 'color':
        return (
          <div className="space-y-1.5">
            <Label className="text-foreground font-medium">{setting.label_ar}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value || '#000000'}
                onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                className="w-10 h-10 rounded-lg border border-border cursor-pointer"
              />
              <Input
                value={value}
                onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                className="flex-1"
                placeholder="#000000"
              />
              {changed && (
                <Button size="sm" onClick={() => handleSave(setting)} disabled={saving === setting.id}>
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );

      case 'url':
        return (
          <div className="space-y-1.5">
            <Label className="text-foreground font-medium">{setting.label_ar}</Label>
            {setting.description_ar && (
              <p className="text-xs text-muted-foreground">{setting.description_ar}</p>
            )}
            <div className="flex items-center gap-2">
              <Input
                value={value}
                onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                placeholder="https://..."
                dir="ltr"
                className="flex-1"
              />
              {changed && (
                <Button size="sm" onClick={() => handleSave(setting)} disabled={saving === setting.id}>
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );

      default:
        const isLong = setting.setting_key.includes('text') || setting.setting_key.includes('message') || setting.setting_key.includes('description') || setting.setting_key.includes('terms') || setting.setting_key.includes('about');
        return (
          <div className="space-y-1.5">
            <Label className="text-foreground font-medium">{setting.label_ar}</Label>
            {setting.description_ar && (
              <p className="text-xs text-muted-foreground">{setting.description_ar}</p>
            )}
            <div className="flex items-start gap-2">
              {isLong ? (
                <Textarea
                  value={value}
                  onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                  rows={3}
                  className="flex-1"
                />
              ) : (
                <Input
                  value={value}
                  onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                  className="flex-1"
                />
              )}
              {changed && (
                <Button size="sm" onClick={() => handleSave(setting)} disabled={saving === setting.id}>
                  <Save className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">إدارة المحتوى (CMS)</h2>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <Plus className="w-4 h-4" />
              إضافة إعداد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إضافة إعداد جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>القسم</Label>
                <Select value={newSetting.category} onValueChange={(v) => setNewSetting(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المفتاح (بالإنجليزية)</Label>
                <Input
                  value={newSetting.setting_key}
                  onChange={(e) => setNewSetting(p => ({ ...p, setting_key: e.target.value }))}
                  dir="ltr"
                  placeholder="my_setting_key"
                />
              </div>
              <div>
                <Label>الاسم بالعربية *</Label>
                <Input
                  value={newSetting.label_ar}
                  onChange={(e) => setNewSetting(p => ({ ...p, label_ar: e.target.value }))}
                />
              </div>
              <div>
                <Label>النوع</Label>
                <Select value={newSetting.setting_type} onValueChange={(v) => setNewSetting(p => ({ ...p, setting_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">نص</SelectItem>
                    <SelectItem value="url">رابط</SelectItem>
                    <SelectItem value="boolean">تبديل (نعم/لا)</SelectItem>
                    <SelectItem value="color">لون</SelectItem>
                    <SelectItem value="number">رقم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>القيمة الافتراضية</Label>
                <Input
                  value={newSetting.setting_value}
                  onChange={(e) => setNewSetting(p => ({ ...p, setting_value: e.target.value }))}
                />
              </div>
              <Button onClick={handleAddSetting} className="w-full">إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-sm text-muted-foreground">
        تحكم بمحتوى التطبيق بالكامل من هنا. أي تغيير سينعكس فوراً على جميع المستخدمين.
      </p>

      <Tabs defaultValue="general">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${CATEGORIES.length}, 1fr)` }}>
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = settings.filter(s => s.category === cat.key).length;
            return (
              <TabsTrigger key={cat.key} value={cat.key} className="gap-1 text-xs">
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{cat.label}</span>
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{count}</Badge>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CATEGORIES.map(cat => {
          const categorySettings = settings.filter(s => s.category === cat.key);
          const hasAnyChanges = categorySettings.some(hasChanges);

          return (
            <TabsContent key={cat.key} value={cat.key} className="space-y-3">
              {hasAnyChanges && (
                <div className="flex justify-end">
                  <Button 
                    onClick={() => handleSaveAll(cat.key)} 
                    disabled={saving === 'all'}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    حفظ جميع التغييرات
                  </Button>
                </div>
              )}

              {categorySettings.map((setting, idx) => (
                <motion.div
                  key={setting.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-4 rounded-xl bg-card/50 border border-border/30 relative group"
                >
                  {renderSettingInput(setting)}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-muted-foreground hover:text-loss"
                    onClick={() => handleDelete(setting.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </motion.div>
              ))}

              {categorySettings.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد إعدادات في هذا القسم
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
