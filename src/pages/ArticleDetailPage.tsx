import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, Loader2, BookOpen, TrendingUp, Sparkles, BarChart3, GraduationCap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { AppLayout } from '@/components/layout/AppLayout';

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
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ArticleDetailPage;
