import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, FileText, Clock, Eye, EyeOff, Newspaper, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  summary_ar: string | null;
  summary_en: string | null;
  category: string;
  image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const CATEGORIES = [
  { value: 'general', label: 'عام' },
  { value: 'forex', label: 'فوركس' },
  { value: 'crypto', label: 'عملات رقمية' },
  { value: 'stocks', label: 'أسهم' },
  { value: 'education', label: 'تعليمي' },
  { value: 'analysis', label: 'تحليل' },
];

const emptyForm = {
  title_ar: '', title_en: '', content_ar: '', content_en: '',
  summary_ar: '', summary_en: '', category: 'general', image_url: '', is_published: false,
};

export const ArticlesManagement = () => {
  const { t } = useTranslation();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchArticles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setArticles(data);
    setLoading(false);
  };

  useEffect(() => { fetchArticles(); }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setImageFile(null);
    setImagePreview(null);
    setShowForm(true);
  };

  const openEdit = (a: Article) => {
    setForm({
      title_ar: a.title_ar, title_en: a.title_en,
      content_ar: a.content_ar, content_en: a.content_en,
      summary_ar: a.summary_ar || '', summary_en: a.summary_en || '',
      category: a.category, image_url: a.image_url || '', is_published: a.is_published,
    });
    setEditingId(a.id);
    setImageFile(null);
    setImagePreview(a.image_url || null);
    setShowForm(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم الصورة يجب أن يكون أقل من 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm(f => ({ ...f, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage
      .from('article-images')
      .upload(fileName, file, { contentType: file.type });
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('article-images')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async () => {
    if (!form.title_ar || !form.content_ar) {
      toast.error('العنوان والمحتوى بالعربية مطلوبان');
      return;
    }
    setSaving(true);

    let imageUrl = form.image_url || null;

    // Upload new image if selected
    if (imageFile) {
      setUploading(true);
      const url = await uploadImage(imageFile);
      setUploading(false);
      if (url) {
        imageUrl = url;
      } else {
        toast.error('فشل رفع الصورة');
        setSaving(false);
        return;
      }
    }

    const payload = {
      title_ar: form.title_ar, title_en: form.title_en,
      content_ar: form.content_ar, content_en: form.content_en,
      summary_ar: form.summary_ar || null, summary_en: form.summary_en || null,
      category: form.category, image_url: imageUrl, is_published: form.is_published,
    };

    if (editingId) {
      const { error } = await supabase.from('articles').update(payload).eq('id', editingId);
      if (error) toast.error('فشل التحديث');
      else { toast.success('تم تحديث المقال'); setShowForm(false); fetchArticles(); }
    } else {
      const { error } = await supabase.from('articles').insert(payload);
      if (error) toast.error('فشل الإضافة');
      else { toast.success('تم إضافة المقال'); setShowForm(false); fetchArticles(); }
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from('articles').delete().eq('id', deleteId);
    if (error) toast.error('فشل الحذف');
    else { toast.success('تم حذف المقال'); fetchArticles(); }
    setDeleteId(null);
  };

  const publishedCount = articles.filter(a => a.is_published).length;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-emerald-500/15 via-emerald-600/5 to-transparent border border-emerald-500/15"
      >
        <div className="absolute top-0 end-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/20">
              <Newspaper className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">إدارة المقالات</h2>
              <p className="text-xs text-muted-foreground/70">
                {articles.length} مقال • {publishedCount} منشور • {articles.length - publishedCount} مسودة
              </p>
            </div>
          </div>
          <Button onClick={openNew} className="gap-2 rounded-xl shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" />
            مقال جديد
          </Button>
        </div>
      </motion.div>

      {/* List */}
      <AnimatePresence mode="popLayout">
        {articles.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-2xl bg-muted/30 mb-4">
              <FileText className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <p className="text-muted-foreground font-medium">لا توجد مقالات بعد</p>
            <p className="text-sm text-muted-foreground/60 mt-1">ابدأ بكتابة أول مقال</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {articles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "rounded-2xl border backdrop-blur-sm transition-all hover:scale-[1.01] overflow-hidden",
                  article.is_published
                    ? "bg-card/50 border-border/25 hover:border-border/40"
                    : "bg-muted/20 border-border/15 opacity-80"
                )}
              >
                <div className="flex gap-3">
                  {/* Thumbnail */}
                  {article.image_url && (
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden">
                      <img src={article.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h3 className="font-bold text-foreground text-sm">{article.title_ar}</h3>
                          <Badge variant={article.is_published ? 'default' : 'secondary'} className="text-[10px] rounded-lg gap-1">
                            {article.is_published ? <><Eye className="w-3 h-3" /> منشور</> : <><EyeOff className="w-3 h-3" /> مسودة</>}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] rounded-lg">
                            {CATEGORIES.find(c => c.value === article.category)?.label || article.category}
                          </Badge>
                        </div>
                        {article.summary_ar && (
                          <p className="text-xs text-muted-foreground/80 line-clamp-1 mb-1.5">{article.summary_ar}</p>
                        )}
                        <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                          <Clock className="w-3 h-3" />
                          {new Date(article.created_at).toLocaleDateString('ar')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-primary/10" onClick={() => openEdit(article)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-loss hover:text-loss hover:bg-loss/10" onClick={() => setDeleteId(article.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل المقال' : 'مقال جديد'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>صورة المقال</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border/30">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 end-2 h-8 w-8 rounded-lg"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute bottom-2 start-2 rounded-lg gap-1.5 text-xs"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    تغيير الصورة
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-36 rounded-xl border-2 border-dashed border-border/40 hover:border-primary/40 bg-muted/20 hover:bg-muted/30 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer"
                >
                  <div className="p-3 rounded-xl bg-primary/10">
                    <ImageIcon className="w-6 h-6 text-primary" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">اضغط لرفع صورة</p>
                  <p className="text-[10px] text-muted-foreground/60">PNG, JPG حتى 5MB</p>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي) *</Label>
                <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" />
              </div>
              <div className="space-y-2">
                <Label>Title (English)</Label>
                <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الملخص (عربي)</Label>
                <Textarea value={form.summary_ar} onChange={e => setForm(f => ({ ...f, summary_ar: e.target.value }))} dir="rtl" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Summary (English)</Label>
                <Textarea value={form.summary_en} onChange={e => setForm(f => ({ ...f, summary_en: e.target.value }))} dir="ltr" rows={2} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المحتوى (عربي) *</Label>
              <RichTextEditor value={form.content_ar} onChange={v => setForm(f => ({ ...f, content_ar: v }))} dir="rtl" placeholder="اكتب محتوى المقال هنا..." />
            </div>
            <div className="space-y-2">
              <Label>Content (English)</Label>
              <RichTextEditor value={form.content_en} onChange={v => setForm(f => ({ ...f, content_en: v }))} dir="ltr" placeholder="Write article content here..." />
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
              <Label>نشر المقال</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {uploading ? 'جاري رفع الصورة...' : saving ? 'جاري الحفظ...' : editingId ? 'تحديث' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المقال</AlertDialogTitle>
            <AlertDialogDescription>هل أنت متأكد من حذف هذا المقال؟ لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-loss hover:bg-loss/90">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
