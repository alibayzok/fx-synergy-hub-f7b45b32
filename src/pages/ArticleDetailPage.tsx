import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Share2, Copy, Check, Loader2, BookOpen, TrendingUp, Sparkles, BarChart3, GraduationCap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';

const APP_URL = 'https://fx-synergy-hub.lovable.app';

const categoryConfig: Record<string, { ar: string; en: string; icon: any; gradient: string }> = {
  general: { ar: 'عام', en: 'General', icon: Globe, gradient: 'from-blue-500/20 to-blue-600/5' },
  forex: { ar: 'فوركس', en: 'Forex', icon: TrendingUp, gradient: 'from-emerald-500/20 to-emerald-600/5' },
  crypto: { ar: 'كريبتو', en: 'Crypto', icon: Sparkles, gradient: 'from-purple-500/20 to-purple-600/5' },
  stocks: { ar: 'أسهم', en: 'Stocks', icon: BarChart3, gradient: 'from-amber-500/20 to-amber-600/5' },
  education: { ar: 'تعليمي', en: 'Education', icon: GraduationCap, gradient: 'from-cyan-500/20 to-cyan-600/5' },
  analysis: { ar: 'تحليل', en: 'Analysis', icon: BookOpen, gradient: 'from-rose-500/20 to-rose-600/5' },
};

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
}

const ShareButtons = ({ articleId, title, summary, isArabic }: { articleId: string; title: string; summary: string; isArabic: boolean }) => {
  const [copied, setCopied] = useState(false);
  const shareUrl = `${APP_URL}/news/article/${articleId}`;
  const shareText = `${title}${summary ? '\n' + summary : ''}`;
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
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

const ArticleDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();
      if (!error && data) setArticle(data as Article);
      setLoading(false);
    };
    fetchArticle();
  }, [id]);

  const getTitle = (a: Article) => isArabic ? a.title_ar : (a.title_en || a.title_ar);
  const getContent = (a: Article) => isArabic ? a.content_ar : (a.content_en || a.content_ar);
  const getSummary = (a: Article) => isArabic ? (a.summary_ar || '') : (a.summary_en || a.summary_ar || '');

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return isArabic ? `منذ ${mins} د` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return isArabic ? `منذ ${hours} س` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return isArabic ? `منذ ${days} ي` : `${days}d ago`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!article) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <BookOpen className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">{isArabic ? 'المقال غير موجود' : 'Article not found'}</h2>
          <p className="text-sm text-muted-foreground mb-4">{isArabic ? 'قد يكون المقال محذوفاً أو غير منشور' : 'The article may have been deleted or unpublished'}</p>
          <Button onClick={() => navigate('/news')} className="gap-2 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            {isArabic ? 'العودة للمقالات' : 'Back to Articles'}
          </Button>
        </div>
      </AppLayout>
    );
  }

  const cat = categoryConfig[article.category] || categoryConfig.general;

  return (
    <AppLayout>
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/80 border-b border-border/20 px-4 py-3 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/news')} className="gap-1.5 rounded-xl">
            <ArrowLeft className="w-4 h-4" />
            {isArabic ? 'رجوع' : 'Back'}
          </Button>
        </header>

        {article.image_url && (
          <div className="relative w-full overflow-hidden">
            <img src={article.image_url} alt={getTitle(article)} className="w-full h-auto max-h-[70vh] object-contain bg-black/5 dark:bg-white/5" />
            <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-background to-transparent" />
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("px-4 pb-8", article.image_url ? "-mt-16 relative z-10" : "pt-4")}
        >
          <div className="flex items-center gap-2 mb-3">
            <Badge className={cn("text-xs px-2.5 py-1 rounded-lg gap-1 border-0 bg-gradient-to-r", cat.gradient)}>
              <cat.icon className="w-3 h-3" />
              {cat[isArabic ? 'ar' : 'en']}
            </Badge>
            <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(article.created_at)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground leading-tight mb-4">{getTitle(article)}</h1>
          {getSummary(article) && (
            <p className="text-sm text-muted-foreground/80 italic mb-5 leading-relaxed">{getSummary(article)}</p>
          )}
          <div className="h-px bg-gradient-to-r from-transparent via-border/40 to-transparent mb-6" />
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 leading-[1.9] prose-headings:font-bold prose-h2:text-lg prose-h3:text-base prose-blockquote:border-s-4 prose-blockquote:border-primary/30 prose-blockquote:ps-4 prose-blockquote:italic prose-a:text-primary prose-a:underline"
            dangerouslySetInnerHTML={{ __html: getContent(article) }}
          />

          <div className="mt-8 pt-6 border-t border-border/20">
            <p className="text-xs text-muted-foreground/60 mb-3">{isArabic ? 'شارك هذا المقال' : 'Share this article'}</p>
            <ShareButtons articleId={article.id} title={getTitle(article)} summary={getSummary(article)} isArabic={isArabic} />
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ArticleDetailPage;
