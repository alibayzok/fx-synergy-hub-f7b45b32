import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Briefcase, Plus, Trash2, Save, Edit2, ExternalLink, Eye, EyeOff,
  GripVertical, Star, StarOff, Loader2, Building2, Palette, Link2, Type,
  Coins, CreditCard
} from 'lucide-react';
import { UsdtListingsManagement } from './UsdtListingsManagement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  id: string;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  icon: string;
  color: string;
  link_url: string;
  link_label_ar: string;
  link_label_en: string;
  is_active: boolean;
  is_external_link: boolean;
  sort_order: number;
  card_type?: string;
  app_store_url?: string;
  play_store_url?: string;
  apk_url?: string;
}

interface BrokerStat {
  label_ar: string;
  label_en: string;
  value: string;
}

interface Broker {
  id: string;
  name: string;
  name_ar: string;
  logo_url: string;
  registration_url: string;
  description_ar: string;
  description_en: string;
  features_ar: string[];
  features_en: string[];
  stats: BrokerStat[];
  color: string;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
}

const ICON_OPTIONS = [
  'Briefcase', 'Coins', 'TrendingUp', 'Shield', 'Zap', 'Gift', 'Globe',
  'Headphones', 'Star', 'Heart', 'DollarSign', 'CreditCard', 'Wallet',
  'BarChart', 'PieChart', 'Target', 'Award', 'BookOpen', 'Users', 'Smartphone'
];

const CARD_TYPE_OPTIONS = [
  { value: 'default', label: 'عادي' },
  { value: 'app_download', label: 'تحميل تطبيق' },
];

export const ServicesAndBrokersManagement = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Service dialog
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceForm, setServiceForm] = useState<Partial<Service>>({});

  // Broker dialog
  const [showBrokerDialog, setShowBrokerDialog] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [brokerForm, setBrokerForm] = useState<Partial<Broker>>({});
  const [featuresText, setFeaturesText] = useState({ ar: '', en: '' });
  const [statsText, setStatsText] = useState('');

  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<{ key: string; label: string }[]>([]);
  const [savingPayments, setSavingPayments] = useState(false);
  const [newMethodKey, setNewMethodKey] = useState('');
  const [newMethodLabel, setNewMethodLabel] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [sRes, bRes, pmRes] = await Promise.all([
      supabase.from('services').select('*').order('sort_order'),
      supabase.from('brokers').select('*').order('sort_order'),
      supabase.from('app_settings').select('setting_value').eq('setting_key', 'usdt_payment_methods').single(),
    ]);
    if (sRes.data) setServices(sRes.data as any);
    if (bRes.data) setBrokers(bRes.data.map((b: any) => ({ ...b, stats: b.stats || [] })) as any);
    // Parse payment methods
    if (pmRes.data?.setting_value) {
      const parsed = pmRes.data.setting_value.split(',').filter(Boolean).map((pair: string) => {
        const [key, ...rest] = pair.split(':');
        return { key: key.trim(), label: (rest.join(':') || key).trim() };
      });
      setPaymentMethods(parsed);
    }
    setLoading(false);
  };




  // ===== SERVICES =====
  const openServiceDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm(service);
    } else {
      setEditingService(null);
      setServiceForm({ icon: 'Briefcase', color: '#3b82f6', is_active: true, is_external_link: false, sort_order: services.length });
    }
    setShowServiceDialog(true);
  };

  const saveService = async () => {
    if (!serviceForm.name_ar) {
      toast({ title: 'أدخل اسم الخدمة', variant: 'destructive' });
      return;
    }
    setSaving(true);
    if (editingService) {
      const { error } = await supabase.from('services').update(serviceForm as any).eq('id', editingService.id);
      if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      else toast({ title: 'تم التحديث ✅' });
    } else {
      const { error } = await supabase.from('services').insert(serviceForm as any);
      if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      else toast({ title: 'تمت الإضافة ✅' });
    }
    setSaving(false);
    setShowServiceDialog(false);
    fetchAll();
  };

  const deleteService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    toast({ title: 'تم الحذف' });
    fetchAll();
  };

  const toggleServiceActive = async (service: Service) => {
    await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
    fetchAll();
  };

  // ===== BROKERS =====
  const openBrokerDialog = (broker?: Broker) => {
    if (broker) {
      setEditingBroker(broker);
      setBrokerForm(broker);
      setFeaturesText({ ar: (broker.features_ar || []).join('\n'), en: (broker.features_en || []).join('\n') });
      setStatsText(JSON.stringify(broker.stats || [], null, 2));
    } else {
      setEditingBroker(null);
      setBrokerForm({ color: '#f59e0b', is_active: true, is_featured: false, sort_order: brokers.length });
      setFeaturesText({ ar: '', en: '' });
      setStatsText('[{"label_ar":"سبريد","label_en":"Spread","value":"0.0"}]');
    }
    setShowBrokerDialog(true);
  };

  const saveBroker = async () => {
    if (!brokerForm.name) {
      toast({ title: 'أدخل اسم البروكر', variant: 'destructive' });
      return;
    }
    setSaving(true);
    let parsedStats: BrokerStat[] = [];
    try { parsedStats = JSON.parse(statsText); } catch { parsedStats = []; }

    const payload = {
      ...brokerForm,
      features_ar: featuresText.ar.split('\n').filter(Boolean),
      features_en: featuresText.en.split('\n').filter(Boolean),
      stats: parsedStats,
    };

    if (editingBroker) {
      const { error } = await supabase.from('brokers').update(payload as any).eq('id', editingBroker.id);
      if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      else toast({ title: 'تم التحديث ✅' });
    } else {
      const { error } = await supabase.from('brokers').insert(payload as any);
      if (error) toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
      else toast({ title: 'تمت الإضافة ✅' });
    }
    setSaving(false);
    setShowBrokerDialog(false);
    fetchAll();
  };

  const deleteBroker = async (id: string) => {
    await supabase.from('brokers').delete().eq('id', id);
    toast({ title: 'تم الحذف' });
    fetchAll();
  };

  const toggleBrokerActive = async (broker: Broker) => {
    await supabase.from('brokers').update({ is_active: !broker.is_active }).eq('id', broker.id);
    fetchAll();
  };

  const toggleBrokerFeatured = async (broker: Broker) => {
    await supabase.from('brokers').update({ is_featured: !broker.is_featured }).eq('id', broker.id);
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-blue-500/15 via-cyan-500/5 to-transparent border border-blue-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 border border-blue-500/20">
              <Briefcase className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إدارة الخدمات والبروكرات</h2>
              <p className="text-xs text-muted-foreground">{services.length} خدمة · {brokers.length} بروكر</p>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="services">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="services" className="gap-2">
            <Briefcase className="w-4 h-4" />
            الخدمات
          </TabsTrigger>
          <TabsTrigger value="usdt_listings" className="gap-2">
            <Coins className="w-4 h-4" />
            إعلانات USDT
          </TabsTrigger>
          <TabsTrigger value="brokers" className="gap-2">
            <Building2 className="w-4 h-4" />
            البروكرات
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="w-4 h-4" />
            طرق الدفع
          </TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-4 mt-4">
          <Button onClick={() => openServiceDialog()} className="w-full gap-2">
            <Plus className="w-4 h-4" /> إضافة خدمة جديدة
          </Button>

          {services.map((service) => (
            <motion.div
              key={service.id}
              layout
              className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: service.color }}>
                    {service.icon.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{service.name_ar}</h3>
                    <p className="text-xs text-muted-foreground">{service.name_en || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge variant={service.is_active ? 'default' : 'secondary'} className="text-[10px]">
                    {service.is_active ? 'مفعّل' : 'معطّل'}
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{service.description_ar}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openServiceDialog(service)} className="gap-1 flex-1">
                  <Edit2 className="w-3 h-3" /> تعديل
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleServiceActive(service)} className="gap-1">
                  {service.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف الخدمة</AlertDialogTitle>
                      <AlertDialogDescription>هل أنت متأكد من حذف "{service.name_ar}"؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteService(service.id)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}

          {services.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد خدمات بعد. أضف خدمة جديدة!
            </div>
          )}
        </TabsContent>

        {/* USDT Listings Tab */}
        <TabsContent value="usdt_listings" className="space-y-4 mt-4">
          <UsdtListingsManagement />
        </TabsContent>

        {/* Brokers Tab */}
        <TabsContent value="brokers" className="space-y-4 mt-4">
          <Button onClick={() => openBrokerDialog()} className="w-full gap-2">
            <Plus className="w-4 h-4" /> إضافة بروكر جديد
          </Button>

          {brokers.map((broker) => (
            <motion.div
              key={broker.id}
              layout
              className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {broker.logo_url ? (
                    <img src={broker.logo_url} alt={broker.name} className="w-10 h-10 rounded-lg object-contain bg-white p-1" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: broker.color }}>
                      {broker.name.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                      {broker.name}
                      {broker.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                    </h3>
                    <p className="text-xs text-muted-foreground">{broker.name_ar}</p>
                  </div>
                </div>
                <Badge variant={broker.is_active ? 'default' : 'secondary'} className="text-[10px]">
                  {broker.is_active ? 'مفعّل' : 'معطّل'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{broker.description_ar}</p>
              {broker.features_ar && broker.features_ar.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {broker.features_ar.slice(0, 3).map((f, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{f}</Badge>
                  ))}
                  {broker.features_ar.length > 3 && (
                    <Badge variant="outline" className="text-[10px]">+{broker.features_ar.length - 3}</Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => openBrokerDialog(broker)} className="gap-1 flex-1">
                  <Edit2 className="w-3 h-3" /> تعديل
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleBrokerFeatured(broker)} className="gap-1">
                  {broker.is_featured ? <StarOff className="w-3 h-3" /> : <Star className="w-3 h-3" />}
                </Button>
                <Button size="sm" variant="outline" onClick={() => toggleBrokerActive(broker)} className="gap-1">
                  {broker.is_active ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>حذف البروكر</AlertDialogTitle>
                      <AlertDialogDescription>هل أنت متأكد من حذف "{broker.name}"؟</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>إلغاء</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteBroker(broker.id)}>حذف</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </motion.div>
          ))}

          {brokers.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد بروكرات بعد. أضف بروكر جديد!
            </div>
          )}
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          <div className="rounded-xl border border-border/40 bg-card/50 p-4 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <Coins className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">طرق الدفع المتاحة</h3>
                <p className="text-xs text-muted-foreground">تظهر للمستخدمين عند طلب شراء/بيع USDT</p>
              </div>
            </div>

            {/* Existing methods */}
            <div className="space-y-2">
              {paymentMethods.map((method, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-muted/20">
                  <div className="flex-1">
                    <Input
                      value={method.label}
                      onChange={(e) => {
                        const updated = [...paymentMethods];
                        updated[idx] = { ...updated[idx], label: e.target.value };
                        setPaymentMethods(updated);
                      }}
                      placeholder="اسم طريقة الدفع"
                      className="h-8 text-sm"
                    />
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-mono shrink-0">{method.key}</Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive h-8 w-8 p-0"
                    onClick={() => setPaymentMethods(prev => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Add new method */}
            <div className="flex items-end gap-2 pt-2 border-t border-border/30">
              <div className="flex-1 space-y-1">
                <Label className="text-xs">المعرّف (إنجليزي)</Label>
                <Input
                  value={newMethodKey}
                  onChange={(e) => setNewMethodKey(e.target.value.replace(/[^a-z0-9_]/gi, '_').toLowerCase())}
                  placeholder="omt"
                  className="h-8 text-sm font-mono"
                  dir="ltr"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs">الاسم</Label>
                <Input
                  value={newMethodLabel}
                  onChange={(e) => setNewMethodLabel(e.target.value)}
                  placeholder="OMT"
                  className="h-8 text-sm"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1"
                disabled={!newMethodKey || !newMethodLabel}
                onClick={() => {
                  setPaymentMethods(prev => [...prev, { key: newMethodKey, label: newMethodLabel }]);
                  setNewMethodKey('');
                  setNewMethodLabel('');
                }}
              >
                <Plus className="w-3.5 h-3.5" /> إضافة
              </Button>
            </div>

            {/* Save */}
            <Button
              className="w-full gap-2"
              disabled={savingPayments}
              onClick={async () => {
                setSavingPayments(true);
                const value = paymentMethods.map(m => `${m.key}:${m.label}`).join(',');
                const { error } = await supabase
                  .from('app_settings')
                  .update({ setting_value: value })
                  .eq('setting_key', 'usdt_payment_methods');
                if (error) {
                  toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
                } else {
                  toast({ title: 'تم حفظ طرق الدفع ✅' });
                }
                setSavingPayments(false);
              }}
            >
              {savingPayments ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ التغييرات
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}</DialogTitle>
            <DialogDescription>أدخل بيانات الخدمة</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم (عربي) *</Label>
                <Input value={serviceForm.name_ar || ''} onChange={(e) => setServiceForm(p => ({ ...p, name_ar: e.target.value }))} />
              </div>
              <div>
                <Label>الاسم (إنجليزي)</Label>
                <Input value={serviceForm.name_en || ''} onChange={(e) => setServiceForm(p => ({ ...p, name_en: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div>
              <Label>الوصف (عربي)</Label>
              <Textarea value={serviceForm.description_ar || ''} onChange={(e) => setServiceForm(p => ({ ...p, description_ar: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>الوصف (إنجليزي)</Label>
              <Textarea value={serviceForm.description_en || ''} onChange={(e) => setServiceForm(p => ({ ...p, description_en: e.target.value }))} dir="ltr" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الأيقونة</Label>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={serviceForm.icon || 'Briefcase'}
                  onChange={(e) => setServiceForm(p => ({ ...p, icon: e.target.value }))}
                >
                  {ICON_OPTIONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                </select>
              </div>
              <div>
                <Label>اللون</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={serviceForm.color || '#3b82f6'}
                    onChange={(e) => setServiceForm(p => ({ ...p, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border cursor-pointer" />
                  <Input value={serviceForm.color || ''} onChange={(e) => setServiceForm(p => ({ ...p, color: e.target.value }))} dir="ltr" />
                </div>
              </div>
            </div>
            <div>
              <Label>رابط الخدمة</Label>
              <Input value={serviceForm.link_url || ''} onChange={(e) => setServiceForm(p => ({ ...p, link_url: e.target.value }))} dir="ltr" placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>نص الزر (عربي)</Label>
                <Input value={serviceForm.link_label_ar || ''} onChange={(e) => setServiceForm(p => ({ ...p, link_label_ar: e.target.value }))} />
              </div>
              <div>
                <Label>نص الزر (إنجليزي)</Label>
                <Input value={serviceForm.link_label_en || ''} onChange={(e) => setServiceForm(p => ({ ...p, link_label_en: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>رابط خارجي (يفتح في تاب جديد)</Label>
              <Switch checked={serviceForm.is_external_link || false}
                onCheckedChange={(v) => setServiceForm(p => ({ ...p, is_external_link: v }))} />
            </div>
            <div>
              <Label>نوع البطاقة</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={(serviceForm as any).card_type || 'default'}
                onChange={(e) => setServiceForm(p => ({ ...p, card_type: e.target.value }))}
              >
                {CARD_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            {(serviceForm as any).card_type === 'app_download' && (
              <div className="space-y-3 p-3 rounded-xl border border-violet-500/20 bg-violet-500/5">
                <Label className="text-violet-400 font-bold">روابط التحميل</Label>
                <div>
                  <Label>رابط Google Play</Label>
                  <Input value={(serviceForm as any).play_store_url || ''} onChange={(e) => setServiceForm(p => ({ ...p, play_store_url: e.target.value }))} dir="ltr" placeholder="https://play.google.com/..." />
                </div>
                <div>
                  <Label>رابط App Store</Label>
                  <Input value={(serviceForm as any).app_store_url || ''} onChange={(e) => setServiceForm(p => ({ ...p, app_store_url: e.target.value }))} dir="ltr" placeholder="https://apps.apple.com/..." />
                </div>
                <div>
                  <Label>رابط APK مباشر</Label>
                  <Input value={(serviceForm as any).apk_url || ''} onChange={(e) => setServiceForm(p => ({ ...p, apk_url: e.target.value }))} dir="ltr" placeholder="https://example.com/app.apk" />
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <Label>مفعّلة</Label>
              <Switch checked={serviceForm.is_active !== false}
                onCheckedChange={(v) => setServiceForm(p => ({ ...p, is_active: v }))} />
            </div>
            <div>
              <Label>الترتيب</Label>
              <Input type="number" value={serviceForm.sort_order || 0}
                onChange={(e) => setServiceForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowServiceDialog(false)}>إلغاء</Button>
            <Button onClick={saveService} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Broker Dialog */}
      <Dialog open={showBrokerDialog} onOpenChange={setShowBrokerDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBroker ? 'تعديل البروكر' : 'إضافة بروكر جديد'}</DialogTitle>
            <DialogDescription>أدخل بيانات البروكر</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم (إنجليزي) *</Label>
                <Input value={brokerForm.name || ''} onChange={(e) => setBrokerForm(p => ({ ...p, name: e.target.value }))} dir="ltr" />
              </div>
              <div>
                <Label>الاسم (عربي)</Label>
                <Input value={brokerForm.name_ar || ''} onChange={(e) => setBrokerForm(p => ({ ...p, name_ar: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>رابط الشعار (Logo URL)</Label>
              <Input value={brokerForm.logo_url || ''} onChange={(e) => setBrokerForm(p => ({ ...p, logo_url: e.target.value }))} dir="ltr" placeholder="https://..." />
            </div>
            <div>
              <Label>رابط التسجيل *</Label>
              <Input value={brokerForm.registration_url || ''} onChange={(e) => setBrokerForm(p => ({ ...p, registration_url: e.target.value }))} dir="ltr" placeholder="https://..." />
            </div>
            <div>
              <Label>الوصف (عربي)</Label>
              <Textarea value={brokerForm.description_ar || ''} onChange={(e) => setBrokerForm(p => ({ ...p, description_ar: e.target.value }))} rows={2} />
            </div>
            <div>
              <Label>الوصف (إنجليزي)</Label>
              <Textarea value={brokerForm.description_en || ''} onChange={(e) => setBrokerForm(p => ({ ...p, description_en: e.target.value }))} dir="ltr" rows={2} />
            </div>
            <div>
              <Label>المميزات (عربي) - سطر لكل ميزة</Label>
              <Textarea value={featuresText.ar} onChange={(e) => setFeaturesText(p => ({ ...p, ar: e.target.value }))} rows={4} placeholder="بونص ترحيبي&#10;سحب سريع&#10;حساب إسلامي" />
            </div>
            <div>
              <Label>المميزات (إنجليزي) - سطر لكل ميزة</Label>
              <Textarea value={featuresText.en} onChange={(e) => setFeaturesText(p => ({ ...p, en: e.target.value }))} dir="ltr" rows={4} placeholder="Welcome bonus&#10;Fast withdrawal&#10;Islamic account" />
            </div>
            <div>
              <Label>الإحصائيات (JSON)</Label>
              <Textarea value={statsText} onChange={(e) => setStatsText(e.target.value)} dir="ltr" rows={4} className="font-mono text-xs" />
              <p className="text-[10px] text-muted-foreground mt-1">مصفوفة JSON: [{`{"label_ar":"..","label_en":"..","value":".."}`}]</p>
            </div>
            <div className="flex items-center gap-2">
              <Label>اللون</Label>
              <input type="color" value={brokerForm.color || '#f59e0b'}
                onChange={(e) => setBrokerForm(p => ({ ...p, color: e.target.value }))}
                className="w-10 h-10 rounded-lg border cursor-pointer" />
              <Input value={brokerForm.color || ''} onChange={(e) => setBrokerForm(p => ({ ...p, color: e.target.value }))} dir="ltr" className="flex-1" />
            </div>
            <div className="flex items-center justify-between">
              <Label>مميز (Featured)</Label>
              <Switch checked={brokerForm.is_featured || false}
                onCheckedChange={(v) => setBrokerForm(p => ({ ...p, is_featured: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <Label>مفعّل</Label>
              <Switch checked={brokerForm.is_active !== false}
                onCheckedChange={(v) => setBrokerForm(p => ({ ...p, is_active: v }))} />
            </div>
            <div>
              <Label>الترتيب</Label>
              <Input type="number" value={brokerForm.sort_order || 0}
                onChange={(e) => setBrokerForm(p => ({ ...p, sort_order: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrokerDialog(false)}>إلغاء</Button>
            <Button onClick={saveBroker} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};
