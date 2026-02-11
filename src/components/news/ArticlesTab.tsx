import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Loader2, ArrowLeft, Plus, Sparkles, BookOpen, TrendingUp, GraduationCap, BarChart3, Globe, Share2, Copy, Check } from 'lucide-react';
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

const APP_URL = 'https://fx-synergy-hub.lovable.app';

const ShareButtons = ({ title, summary, isArabic, variant = 'compact' }: { title: string; summary: string; isArabic: boolean; variant?: 'compact' | 'full' }) => {
  const [copied, setCopied] = useState(false);
  const shareText = `${title}${summary ? '\n' + summary : ''}`;
  const shareUrl = APP_URL;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent(shareUrl);

  const shareLinks = [
    { name: 'WhatsApp', color: 'bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366]', url: `https://wa.me/?text=${encodedText}%0A${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.613.613l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.317 0-4.46-.757-6.199-2.038l-.435-.332-2.665.893.893-2.665-.332-.435A9.96 9.96 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg> },
    { name: 'Telegram', color: 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 text-[#0088cc]', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> },
    { name: 'X', color: 'bg-foreground/10 hover:bg-foreground/20 text-foreground', url: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
    { name: 'Facebook', color: 'bg-[#1877F2]/15 hover:bg-[#1877F2]/25 text-[#1877F2]', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
      icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        {shareLinks.map(link => (
          <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
            className={cn("p-1.5 rounded-lg transition-colors", link.color)}>
            {link.icon}
          </a>
        ))}
        <button onClick={copyToClipboard} className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-colors">
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {shareLinks.map(link => (
        <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
          className={cn("flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors", link.color)}>
          {link.icon}
          {link.name}
        </a>
      ))}
      <button onClick={copyToClipboard}
        className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-muted/30 hover:bg-muted/50 text-muted-foreground transition-colors">
        {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />{isArabic ? 'تم النسخ' : 'Copied'}</> : <><Copy className="w-3.5 h-3.5" />{isArabic ? 'نسخ الرابط' : 'Copy Link'}</>}
      </button>
    </div>
  );
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
