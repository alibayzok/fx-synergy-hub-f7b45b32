import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, Clock, Eye, Loader2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

const categoryLabels: Record<string, { ar: string; en: string }> = {
  general: { ar: 'عام', en: 'General' },
  forex: { ar: 'فوركس', en: 'Forex' },
  crypto: { ar: 'كريبتو', en: 'Crypto' },
  stocks: { ar: 'أسهم', en: 'Stocks' },
  education: { ar: 'تعليمي', en: 'Education' },
  analysis: { ar: 'تحليل', en: 'Analysis' },
};

export const ArticlesTab = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
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
    fetchArticles();
  }, []);

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

  // Article Detail
  if (selectedArticle) {
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 glass-card border-b border-border/30 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(null)} className="gap-1.5">
            <ArrowLeft className="w-4 h-4" />
            {isArabic ? 'رجوع' : 'Back'}
          </Button>
        </header>

        {selectedArticle.image_url && (
          <div className="relative h-48 overflow-hidden">
            <img src={selectedArticle.image_url} alt={getTitle(selectedArticle)} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("px-4 pb-8", selectedArticle.image_url ? "-mt-10 relative z-10" : "pt-4")}>
          <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-lg mb-3">
            {categoryLabels[selectedArticle.category]?.[isArabic ? 'ar' : 'en'] || selectedArticle.category}
          </Badge>
          <h1 className="text-xl font-bold text-foreground leading-snug mb-3">{getTitle(selectedArticle)}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{timeAgo(selectedArticle.created_at)}</span>
          </div>
          <div className="h-px bg-border/30 mb-6" />
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{getContent(selectedArticle)}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h2 className="text-base font-bold text-foreground">{isArabic ? 'المقالات' : 'Articles'}</h2>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      )}

      {!loading && articles.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="p-4 rounded-2xl bg-muted/30 mb-4"><FileText className="w-10 h-10 text-muted-foreground/40" /></div>
          <p className="text-sm font-medium text-muted-foreground">{isArabic ? 'لا توجد مقالات حالياً' : 'No articles yet'}</p>
          <p className="text-xs text-muted-foreground/60 mt-1">{isArabic ? 'سيتم إضافة مقالات قريباً' : 'Articles will be added soon'}</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="space-y-3">
          {articles.map((article, index) => (
            <motion.div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group rounded-2xl border border-border/25 bg-card/50 backdrop-blur-sm overflow-hidden cursor-pointer hover:border-border/40 transition-all"
            >
              {article.image_url && (
                <div className="relative h-36 overflow-hidden">
                  <img src={article.image_url} alt={getTitle(article)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                </div>
              )}
              <div className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 rounded-md">
                    {categoryLabels[article.category]?.[isArabic ? 'ar' : 'en'] || article.category}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground/60">{timeAgo(article.created_at)}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2 mb-1">{getTitle(article)}</h3>
                {getSummary(article) && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{getSummary(article)}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
