import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Settings, Globe, Type, Link2, ToggleRight, Megaphone,
  Save, Plus, Trash2, Check, X, Palette, ImageIcon, Upload, Loader2, RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
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
  { key: 'services', label: 'الخدمات', icon: Globe },
  { key: 'announcements', label: 'الإعلانات', icon: Megaphone },
  { key: 'images', label: 'الصور', icon: ImageIcon },
];

export const CMSManagement = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
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

  const DEFAULTS: Record<string, string> = {
    app_name: 'ASSASSIN FX',
    app_description: 'منصة تداول احترافية',
    welcome_message: 'مرحباً بك في منصة التداول الاحترافية',
    maintenance_mode: 'false',
    maintenance_message: 'التطبيق تحت الصيانة، يرجى المحاولة لاحقاً',
    home_hero_title: 'أهلاً بك في عالم التداول',
    home_hero_subtitle: 'تداول بذكاء مع فريق من المحترفين',
    footer_text: '© جميع الحقوق محفوظة',
    about_text: '', terms_text: '',
    telegram_url: '', facebook_url: '', instagram_url: '', whatsapp_url: '', support_email: '',
    enable_usdt_service: 'true', enable_broker_service: 'true', enable_community: 'true',
    enable_ai_chat: 'true', enable_analyses: 'true',
    banner_text: '', banner_active: 'false', banner_color: '#f59e0b',
    popup_title: '', popup_message: '', popup_active: 'false',
    logo_url: '', logo_dark_url: '', hero_bg_url: '', splash_bg_url: '', auth_bg_url: '', favicon_url: '',
  };

  const handleRestoreDefaults = async () => {
    setSaving('all');
    for (const setting of settings) {
      const defaultVal = DEFAULTS[setting.setting_key];
      if (defaultVal !== undefined) {
        await supabase
          .from('app_settings')
          .update({ setting_value: defaultVal, updated_at: new Date().toISOString(), updated_by: user?.id })
          .eq('id', setting.id);
      }
    }
    toast({ title: 'تم استعادة الافتراضيات ✅', description: 'تم إعادة جميع الإعدادات إلى قيمها الافتراضية' });
    await fetchSettings();
    setSaving(null);
  };

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

  const handleImageUpload = async (setting: Setting, file: File) => {
    setUploading(setting.id);
    const ext = file.name.split('.').pop();
    const filePath = `${setting.setting_key}_${Date.now()}.${ext}`;

    // Delete old file if exists
    const oldUrl = setting.setting_value;
    if (oldUrl) {
      const oldPath = oldUrl.split('/cms-assets/')[1];
      if (oldPath) {
        await supabase.storage.from('cms-assets').remove([oldPath]);
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('cms-assets')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: 'خطأ في الرفع', description: uploadError.message, variant: 'destructive' });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from('cms-assets').getPublicUrl(filePath);
    const publicUrl = urlData.publicUrl;

    const { error } = await supabase
      .from('app_settings')
      .update({ setting_value: publicUrl, updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq('id', setting.id);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم رفع الصورة ✅', description: setting.label_ar });
      setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, setting_value: publicUrl } : s));
      setEditedValues(prev => ({ ...prev, [setting.id]: publicUrl }));
    }
    setUploading(null);
  };

  const handleImageRemove = async (setting: Setting) => {
    const oldUrl = setting.setting_value;
    if (oldUrl) {
      const oldPath = oldUrl.split('/cms-assets/')[1];
      if (oldPath) {
        await supabase.storage.from('cms-assets').remove([oldPath]);
      }
    }

    await supabase
      .from('app_settings')
      .update({ setting_value: '', updated_at: new Date().toISOString(), updated_by: user?.id })
      .eq('id', setting.id);

    setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, setting_value: '' } : s));
    setEditedValues(prev => ({ ...prev, [setting.id]: '' }));
    toast({ title: 'تم حذف الصورة' });
  };

  const renderSettingInput = (setting: Setting) => {
    const value = editedValues[setting.id] ?? '';
    const changed = hasChanges(setting);

    switch (setting.setting_type) {
      case 'image':
        return (
          <div className="space-y-2">
            <Label className="text-foreground font-medium">{setting.label_ar}</Label>
            {setting.description_ar && (
              <p className="text-xs text-muted-foreground">{setting.description_ar}</p>
            )}
            {value ? (
              <div className="relative group/img w-fit">
                <img
                  src={value}
                  alt={setting.label_ar}
                  className="max-h-32 max-w-full rounded-lg border border-border object-contain bg-muted/30"
                />
                <div className="absolute inset-0 bg-background/70 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(setting, file);
                      }}
                    />
                    <div className="bg-foreground/20 backdrop-blur-sm rounded-lg p-2 hover:bg-foreground/30 transition-colors">
                      <Upload className="w-4 h-4 text-foreground" />
                    </div>
                  </label>
                  <button
                    onClick={() => handleImageRemove(setting)}
                    className="bg-foreground/20 backdrop-blur-sm rounded-lg p-2 hover:bg-destructive/50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-foreground" />
                  </button>
                </div>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(setting, file);
                  }}
                />
                <div className="border-2 border-dashed border-border/50 rounded-xl p-6 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  {uploading === setting.id ? (
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {uploading === setting.id ? 'جاري الرفع...' : 'اضغط لرفع صورة'}
                  </span>
                </div>
              </label>
            )}
          </div>
        );

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
        // Handle password type (for API keys)
        if (setting.setting_type === 'password') {
          return (
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">{setting.label_ar}</Label>
              {setting.description_ar && (
                <p className="text-xs text-muted-foreground">{setting.description_ar}</p>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={value}
                  onChange={(e) => setEditedValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                  placeholder="sk-... أو AIza..."
                  dir="ltr"
                  className="flex-1 font-mono text-sm"
                />
                {changed && (
                  <Button size="sm" onClick={() => handleSave(setting)} disabled={saving === setting.id}>
                    <Save className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {value && (
                <Badge variant="outline" className="text-xs text-emerald-500 border-emerald-500/30">
                  <Check className="w-3 h-3 mr-1" /> مفتاح محفوظ
                </Badge>
              )}
            </div>
          );
        }

        // Handle select:option1,option2,... type
        if (setting.setting_type.startsWith('select:')) {
          let selectOptions = setting.setting_type.replace('select:', '').split(',');
          
          // Filter AI models based on provider selection
          if (setting.setting_key === 'ai_model') {
            const providerSetting = settings.find(s => s.setting_key === 'ai_provider');
            const currentProvider = editedValues[providerSetting?.id || ''] ?? providerSetting?.setting_value ?? 'lovable';
            if (currentProvider === 'custom') {
              selectOptions = selectOptions.filter(opt => opt.startsWith('google/'));
            }
          }
          return (
            <div className="space-y-1.5">
              <Label className="text-foreground font-medium">{setting.label_ar}</Label>
              {setting.description_ar && (
                <p className="text-xs text-muted-foreground">{setting.description_ar}</p>
              )}
              <Select
                value={value}
                onValueChange={(newVal) => {
                  setEditedValues(prev => ({ ...prev, [setting.id]: newVal }));
                  supabase
                    .from('app_settings')
                    .update({ setting_value: newVal, updated_at: new Date().toISOString(), updated_by: user?.id })
                    .eq('id', setting.id)
                    .then(({ error }) => {
                      if (!error) {
                        setSettings(prev => prev.map(s => s.id === setting.id ? { ...s, setting_value: newVal } : s));
                        toast({ title: `${setting.label_ar}: ${newVal}` });
                      }
                    });
                }}
              >
                <SelectTrigger className="w-full" dir="ltr">
                  <SelectValue placeholder="اختر..." />
                </SelectTrigger>
                <SelectContent>
                  {selectOptions.map(opt => (
                    <SelectItem key={opt} value={opt} dir="ltr">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          );
        }

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
    <div className="space-y-5">
      {/* Premium Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-rose-500/15 via-rose-600/5 to-transparent border border-rose-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/20">
              <Palette className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إدارة المحتوى (CMS)</h2>
              <p className="text-xs text-muted-foreground/70">{settings.length} إعداد في {CATEGORIES.length} أقسام</p>
            </div>
          </div>
        <div className="flex items-center gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 text-muted-foreground">
                <RotateCcw className="w-4 h-4" />
                استعادة الافتراضيات
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>استعادة الإعدادات الافتراضية؟</AlertDialogTitle>
                <AlertDialogDescription>
                  سيتم إعادة جميع الإعدادات إلى قيمها الافتراضية. هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={handleRestoreDefaults} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  استعادة
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
                      <SelectItem value="image">صورة</SelectItem>
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
        </div>
      </motion.div>

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
