import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Loader2, ArrowLeft, Plus, Sparkles, BookOpen, TrendingUp, GraduationCap, BarChart3, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, X, ImageIcon } from 'lucide-react';

interface Article {
  id: string;
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
  summary_ar: string;
  summary_en: string;
  category: string;
  image_url: string;
  is_published: boolean;
  created_at: string;
}

const categoryConfig: Record<string, { ar: string; en: string; icon: any; gradient: string }> = {
  general: { ar: 'عام', en: 'General', icon: Globe, gradient: 'from-blue-500/20 to-blue-600/5' },
  forex: { ar: 'فوركس', en: 'Forex', icon: TrendingUp, gradient: 'from-emerald-500/20 to-emerald-600/5' },
  crypto: { ar: 'كريبتو', en: 'Crypto', icon: Sparkles, gradient: 'from-purple-500/20 to-purple-600/5' },
  stocks: { ar: 'أسهم', en: 'Stocks', icon: BarChart3, gradient: 'from-amber-500/20 to-amber-600/5' },
  education: { ar: 'تعليمي', en: 'Education', icon: GraduationCap, gradient: 'from-cyan-500/20 to-cyan-600/5' },
  analysis: { ar: 'تحليل', en: 'Analysis', icon: BookOpen, gradient: 'from-rose-500/20 to-rose-600/5' },
};

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
  summary_ar: '', summary_en: '', category: 'general', is_published: true,
};

export const ArticlesTab = () => {
  const { i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const isArabic = i18n.language === 'ar';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Admin quick-create state
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setArticles((data as any[]) || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchArticles(); }, []);

  const getTitle = (a: Article) => isArabic ? a.title_ar : (a.title_en || a.title_ar);
  const getContent = (a: Article) => isArabic ? a.content_ar : (a.content_en || a.content_ar);
  const getSummary = (a: Article) => isArabic ? a.summary_ar : (a.summary_en || a.summary_ar);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isArabic ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isArabic ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isArabic ? `منذ ${days} ي` : `${days}d ago`;
  };

  const filteredArticles = activeFilter === 'all'
    ? articles
    : articles.filter(a => a.category === activeFilter);

  const usedCategories = ['all', ...new Set(articles.map(a => a.category))];

  // Admin image upload
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('حجم الصورة يجب أن يكون أقل من 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from('article-images').upload(fileName, file, { contentType: file.type });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('article-images').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleQuickSave = async () => {
    if (!form.title_ar || !form.content_ar) { toast.error('العنوان والمحتوى مطلوبان'); return; }
    setSaving(true);
    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl) { toast.error('فشل رفع الصورة'); setSaving(false); return; }
    }
    const payload = {
      ...form,
      summary_ar: form.summary_ar || null,
      summary_en: form.summary_en || null,
      image_url: imageUrl,
    };
    const { error } = await supabase.from('articles').insert(payload);
    if (error) toast.error('فشل الإضافة');
    else { toast.success('تم نشر المقال'); setShowForm(false); setForm(emptyForm); removeImage(); fetchArticles(); }
    setSaving(false);
  };

  const openArticle = (article: Article) => navigate(`/news/article/${article.id}`);

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Header with admin button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <BookOpen className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-base font-bold text-foreground">{isArabic ? 'المقالات' : 'Articles'}</h2>
        </div>
        {isAdmin && (
          <Button
            size="sm"
            onClick={() => { setForm(emptyForm); removeImage(); setShowForm(true); }}
            className="gap-1.5 rounded-xl text-xs shadow-lg shadow-primary/20"
          >
            <Plus className="w-3.5 h-3.5" />
            {isArabic ? 'مقال جديد' : 'New Article'}
          </Button>
        )}
      </div>

      {/* Category Filter */}
      {articles.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4 scrollbar-hide">
          <div className="flex gap-2">
            {usedCategories.map(cat => {
              const config = cat === 'all' ? null : categoryConfig[cat];
              const isActive = activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-card/50 text-muted-foreground border-border/20 hover:border-border/40"
                  )}
                >
                  {cat === 'all'
                    ? (isArabic ? 'الكل' : 'All')
                    : (config?.[isArabic ? 'ar' : 'en'] || cat)
                  }
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      )}

      {!loading && filteredArticles.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted/20 mb-4 border border-border/10">
            <FileText className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{isArabic ? 'لا توجد مقالات حالياً' : 'No articles yet'}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{isArabic ? 'سيتم إضافة مقالات قريباً' : 'Articles will be added soon'}</p>
        </div>
      )}

      {!loading && filteredArticles.length > 0 && (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4">
            {/* Featured first article */}
            {filteredArticles.length > 0 && (
              <motion.div
                key={filteredArticles[0].id}
                onClick={() => openArticle(filteredArticles[0])}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-2xl overflow-hidden cursor-pointer border border-border/20 hover:border-border/40 transition-all shadow-lg shadow-background/50"
              >
                {filteredArticles[0].image_url ? (
                  <div className="relative h-52 overflow-hidden">
                    <img
                      src={filteredArticles[0].image_url}
                      alt={getTitle(filteredArticles[0])}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
                    <div className="absolute bottom-0 inset-x-0 p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={cn("text-[10px] px-2 py-0.5 rounded-lg gap-1 border-0 backdrop-blur-sm bg-background/30")}>
                          {categoryConfig[filteredArticles[0].category]?.[isArabic ? 'ar' : 'en'] || filteredArticles[0].category}
                        </Badge>
                        <span className="text-[10px] text-foreground/70">{timeAgo(filteredArticles[0].created_at)}</span>
                      </div>
                      <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">{getTitle(filteredArticles[0])}</h3>
                      {getSummary(filteredArticles[0]) && (
                        <p className="text-xs text-foreground/70 line-clamp-1 mt-1">{getSummary(filteredArticles[0])}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className={cn("p-5 bg-gradient-to-br", categoryConfig[filteredArticles[0].category]?.gradient || 'from-primary/10 to-transparent')}>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-[10px] rounded-lg">
                        {categoryConfig[filteredArticles[0].category]?.[isArabic ? 'ar' : 'en'] || filteredArticles[0].category}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/60">{timeAgo(filteredArticles[0].created_at)}</span>
                    </div>
                    <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2">{getTitle(filteredArticles[0])}</h3>
                    {getSummary(filteredArticles[0]) && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5">{getSummary(filteredArticles[0])}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Rest of articles */}
            {filteredArticles.slice(1).map((article, index) => {
              const cat = categoryConfig[article.category] || categoryConfig.general;
              return (
                <motion.div
                  key={article.id}
                  onClick={() => openArticle(article)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  className="group flex gap-3 rounded-2xl border border-border/20 bg-card/30 backdrop-blur-sm overflow-hidden cursor-pointer hover:border-border/40 hover:bg-card/50 transition-all"
                >
                  {article.image_url ? (
                    <div className="relative w-28 flex-shrink-0 overflow-hidden">
                      <img
                        src={article.image_url}
                        alt={getTitle(article)}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className={cn("w-28 flex-shrink-0 flex items-center justify-center bg-gradient-to-br", cat.gradient)}>
                      <cat.icon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-3 pe-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md border-border/30">
                        {cat[isArabic ? 'ar' : 'en']}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {timeAgo(article.created_at)}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-1">{getTitle(article)}</h3>
                    {getSummary(article) && (
                      <p className="text-[11px] text-muted-foreground/70 line-clamp-2">{getSummary(article)}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}

      {/* Admin Quick Create Dialog */}
      {isAdmin && (
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>مقال جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden border border-border/30">
                  <img src={imagePreview} alt="" className="w-full h-36 object-cover" />
                  <Button variant="destructive" size="icon" className="absolute top-2 end-2 h-7 w-7 rounded-lg" onClick={removeImage}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="w-full h-28 rounded-xl border-2 border-dashed border-border/30 hover:border-primary/30 bg-muted/10 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer">
                  <ImageIcon className="w-5 h-5 text-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground/60">رفع صورة</p>
                </button>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">العنوان (عربي) *</Label>
                <Input value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} dir="rtl" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Title (English)</Label>
                <Input value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} dir="ltr" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">الملخص</Label>
                <Textarea value={form.summary_ar} onChange={e => setForm(f => ({ ...f, summary_ar: e.target.value }))} dir="rtl" rows={2} className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">المحتوى (عربي) *</Label>
                <RichTextEditor value={form.content_ar} onChange={v => setForm(f => ({ ...f, content_ar: v }))} dir="rtl" placeholder="اكتب محتوى المقال..." minHeight="150px" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">التصنيف</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_published} onCheckedChange={v => setForm(f => ({ ...f, is_published: v }))} />
                <Label className="text-xs">نشر فوري</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>إلغاء</Button>
              <Button size="sm" onClick={handleQuickSave} disabled={saving}>
                {saving ? 'جاري النشر...' : 'نشر المقال'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
