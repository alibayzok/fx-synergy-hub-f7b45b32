import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Eye, Heart, Crown, Radio, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useSignals } from '@/hooks/useSignals';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface SignalForm {
  title: string;
  content: string;
  symbol: string;
  asset_type: string;
  timeframe: string;
  visibility: string;
}

const defaultForm: SignalForm = {
  title: '', content: '', symbol: '', asset_type: 'forex', timeframe: 'H4', visibility: 'free',
};

export const SignalsManagement = () => {
  const { t } = useTranslation();
  const { signals, loading, createSignal, updateSignal, deleteSignal } = useSignals();
  const { user } = useAuth();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<SignalForm>(defaultForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleEdit = (signal: any) => {
    setEditId(signal.id);
    setForm({
      title: signal.title, content: signal.content, symbol: signal.symbol || '',
      asset_type: signal.asset_type || 'forex', timeframe: signal.timeframe || 'H4',
      visibility: signal.visibility || 'free',
    });
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    const payload = {
      title: form.title, content: form.content, symbol: form.symbol || null,
      asset_type: form.asset_type as any, timeframe: form.timeframe as any,
      visibility: form.visibility as any, created_by: user?.id || null,
    };
    if (editId) { await updateSignal(editId, payload); }
    else { await createSignal(payload as any); }
    setSaving(false);
    setShowForm(false);
    setEditId(null);
    setForm(defaultForm);
  };

  const handleDelete = async () => {
    if (deleteId) { await deleteSignal(deleteId); setDeleteId(null); }
  };

  const freeCount = signals.filter(s => s.visibility === 'free').length;
  const vipCount = signals.filter(s => s.visibility === 'vip').length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Premium Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500/15 via-emerald-600/5 to-transparent border border-emerald-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Radio className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إدارة الإشارات</h2>
              <p className="text-xs text-muted-foreground/70">
                {signals.length} إشارة • {freeCount} مجاني • {vipCount} VIP
              </p>
            </div>
          </div>
          <Button onClick={() => { setEditId(null); setForm(defaultForm); setShowForm(true); }} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            إشارة جديدة
          </Button>
        </div>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {signals.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
              <Radio className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">لا توجد إشارات بعد</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {signals.map((signal, index) => (
              <motion.div key={signal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-4 rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01]",
                  signal.visibility === 'vip' 
                    ? "bg-gradient-to-br from-amber-500/8 to-transparent border-amber-500/25 shadow-[0_0_20px_rgba(245,158,11,0.06)]" 
                    : "bg-card/50 border-border/25 hover:border-border/40"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-bold text-foreground">{signal.title}</h3>
                      {signal.visibility === 'vip' && (
                        <Badge variant="outline" className="bg-amber-500/15 text-amber-400 border-amber-500/25 gap-1 text-[10px] rounded-lg">
                          <Crown className="w-3 h-3" /> VIP
                        </Badge>
                      )}
                      {signal.symbol && <Badge variant="secondary" className="text-xs rounded-lg">{signal.symbol}</Badge>}
                      <Badge variant="outline" className="text-xs rounded-lg">{signal.timeframe}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground/80 line-clamp-2 mb-3">{signal.content}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{signal.views_count}</span>
                      <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{signal.likes_count}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(signal.created_at).toLocaleDateString('ar')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10" onClick={() => handleEdit(signal)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteId(signal.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'تعديل الإشارة' : 'إشارة جديدة'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>العنوان</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="عنوان الإشارة" className="rounded-xl" />
            </div>
            <div>
              <Label>المحتوى</Label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="تفاصيل الإشارة..." rows={5} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الرمز</Label>
                <Input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))} placeholder="XAUUSD" className="rounded-xl" />
              </div>
              <div>
                <Label>نوع الأصل</Label>
                <Select value={form.asset_type} onValueChange={v => setForm(f => ({ ...f, asset_type: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="forex">فوركس</SelectItem>
                    <SelectItem value="crypto">كريبتو</SelectItem>
                    <SelectItem value="metals">معادن</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الإطار الزمني</Label>
                <Select value={form.timeframe} onValueChange={v => setForm(f => ({ ...f, timeframe: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['M5', 'M15', 'H1', 'H4', 'D1'].map(tf => <SelectItem key={tf} value={tf}>{tf}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الرؤية</Label>
                <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">مجاني</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.title || !form.content} className="rounded-xl">
              {saving ? 'جاري الحفظ...' : editId ? 'تحديث' : 'نشر'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الإشارة</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذه الإشارة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
