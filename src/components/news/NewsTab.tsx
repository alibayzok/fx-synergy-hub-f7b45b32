import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Globe, Clock, Search, 
  Bookmark, BookmarkCheck, Flame, Sparkles, ArrowUpRight,
  RefreshCw, Loader2, AlertCircle, ArrowLeft, ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type NewsCategory = 'all' | 'forex' | 'crypto' | 'economy' | 'stocks';

interface NewsArticle {
  id: string;
  title: string;
  title_ar: string;
  summary: string;
  summary_ar: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  imageUrl: string;
}

const categoryConfig: Record<NewsCategory, { icon: typeof Globe; color: string; gradient: string }> = {
  all: { icon: Globe, color: 'text-primary', gradient: 'from-primary/20 to-primary/5' },
  forex: { icon: TrendingUp, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-500/5' },
  crypto: { icon: Sparkles, color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-500/5' },
  economy: { icon: Globe, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-500/5' },
  stocks: { icon: TrendingUp, color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-500/5' },
};

const categoryImages: Record<string, string> = {
  forex: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=60',
  crypto: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&q=60',
  economy: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=400&q=60',
  stocks: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=60',
};

const categories: { key: NewsCategory; labelAr: string; labelEn: string }[] = [
  { key: 'all', labelAr: 'الكل', labelEn: 'All' },
  { key: 'forex', labelAr: 'فوركس', labelEn: 'Forex' },
  { key: 'crypto', labelAr: 'كريبتو', labelEn: 'Crypto' },
  { key: 'economy', labelAr: 'اقتصاد', labelEn: 'Economy' },
  { key: 'stocks', labelAr: 'أسهم', labelEn: 'Stocks' },
];

export const NewsTab = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isArabic = i18n.language === 'ar';
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [articleContent, setArticleContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);

  const fetchNews = useCallback(async (category: NewsCategory = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-news', {
        body: { category },
      });
      if (fnError) throw fnError;
      if (data?.success && data?.data) {
        setArticles(data.data);
        setLastFetched(new Date());
      } else {
        throw new Error(data?.error || 'Failed to fetch news');
      }
    } catch (err: any) {
      console.error('Error fetching news:', err);
      setError(err.message || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(activeCategory);
  }, [activeCategory]);

  const openArticle = useCallback(async (article: NewsArticle) => {
    setSelectedArticle(article);
    setArticleContent('');
    setLoadingContent(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-article', {
        body: { url: article.link, language: i18n.language },
      });
      if (fnError) throw fnError;
      if (data?.success && data?.content) {
        setArticleContent(data.content);
      }
    } catch (err) {
      console.error('Error fetching article:', err);
    } finally {
      setLoadingContent(false);
    }
  }, [i18n.language]);

  const getTitle = (article: NewsArticle) => isArabic && article.title_ar ? article.title_ar : article.title;
  const getSummary = (article: NewsArticle) => isArabic && article.summary_ar ? article.summary_ar : article.summary;

  const featuredArticles = articles.slice(0, 3);
  const filteredNews = articles.filter((n, idx) => {
    if (idx < 3) return false;
    const title = getTitle(n);
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const toggleSave = (id: string) => {
    setSavedArticles(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex(i => (i + 1) % featuredArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredArticles.length]);

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return isArabic ? 'الآن' : 'now';
      if (mins < 60) return isArabic ? `منذ ${mins} د` : `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return isArabic ? `منذ ${hours} س` : `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return isArabic ? `منذ ${days} ي` : `${days}d ago`;
    } catch { return ''; }
  };

  const getArticleImage = (article: NewsArticle) => {
    if (article.imageUrl) return article.imageUrl;
    return categoryImages[article.category] || categoryImages.economy;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(isArabic ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch { return ''; }
  };

  // Article Detail View
  if (selectedArticle) {
    const catKey = (selectedArticle.category as NewsCategory) || 'economy';
    const config = categoryConfig[catKey] || categoryConfig.economy;
    return (
      <div className="min-h-screen">
        <header className="sticky top-0 z-30 glass-card border-b border-border/30 px-4 py-3">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setSelectedArticle(null)} className="gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              {isArabic ? 'رجوع' : 'Back'}
            </Button>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleSave(selectedArticle.id)} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                {savedArticles.includes(selectedArticle.id)
                  ? <BookmarkCheck className="w-5 h-5 text-primary" />
                  : <Bookmark className="w-5 h-5 text-muted-foreground" />}
              </button>
              <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </header>

        <div className="relative h-56 overflow-hidden">
          <img src={getArticleImage(selectedArticle)} alt={getTitle(selectedArticle)} className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).src = categoryImages[selectedArticle.category] || categoryImages.economy; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-4 -mt-12 relative z-10 pb-8">
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className={cn("text-xs px-2 py-0.5 rounded-lg border-current/20", config.color)}>
              {categories.find(c => c.key === catKey) ? (isArabic ? categories.find(c => c.key === catKey)?.labelAr : categories.find(c => c.key === catKey)?.labelEn) : selectedArticle.category}
            </Badge>
            <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-lg bg-background/60 backdrop-blur-md border-border/30">
              {selectedArticle.source}
            </Badge>
          </div>

          <h1 className="text-xl font-bold text-foreground leading-snug mb-3">{getTitle(selectedArticle)}</h1>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{formatDate(selectedArticle.pubDate)}</span>
          </div>

          <div className="h-px bg-border/30 mb-6" />

          {loadingContent ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">{isArabic ? 'جاري تحميل المقال...' : 'Loading article...'}</p>
            </div>
          ) : articleContent ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{articleContent}</p>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {getSummary(selectedArticle) ? (
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">{getSummary(selectedArticle)}</p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isArabic ? 'لم يتم العثور على محتوى المقال. يمكنك قراءته من المصدر أدناه.' : 'Article content not available. Read from the source below.'}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 p-4 rounded-2xl bg-muted/30 border border-border/20">
            <p className="text-xs text-muted-foreground mb-2">{isArabic ? 'المصدر الأصلي' : 'Original Source'}</p>
            <a href={selectedArticle.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <ExternalLink className="w-4 h-4" />
              {isArabic ? 'قراءة المقال الكامل على' : 'Read full article on'} {selectedArticle.source}
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      {/* Category + Search */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-profit/10 border border-profit/20">
            <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
            <span className="text-[10px] font-medium text-profit">LIVE</span>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => fetchNews(activeCategory)} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input type="text" placeholder={isArabic ? 'ابحث في الأخبار...' : 'Search news...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="ps-10 rounded-xl bg-muted/50 border-border/30 focus:border-primary/40" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => {
            const config = categoryConfig[cat.key];
            const CatIcon = config.icon;
            return (
              <button key={cat.key} onClick={() => { setActiveCategory(cat.key); setFeaturedIndex(0); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                  activeCategory === cat.key
                    ? `bg-gradient-to-r ${config.gradient} ${config.color} border-current/20 shadow-sm`
                    : "bg-card/30 text-muted-foreground border-border/20 hover:bg-card/60"
                )}>
                <CatIcon className="w-3.5 h-3.5" />
                {isArabic ? cat.labelAr : cat.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-3 space-y-4">
        {loading && articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">{isArabic ? 'جاري تحميل الأخبار...' : 'Loading news...'}</p>
          </div>
        )}

        {error && articles.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-2xl bg-destructive/10 mb-4"><AlertCircle className="w-8 h-8 text-destructive" /></div>
            <p className="text-sm font-medium mb-4">{isArabic ? 'تعذر تحميل الأخبار' : 'Failed to load news'}</p>
            <Button onClick={() => fetchNews(activeCategory)} size="sm" className="gap-2"><RefreshCw className="w-3.5 h-3.5" />{isArabic ? 'إعادة المحاولة' : 'Retry'}</Button>
          </div>
        )}

        {/* Featured */}
        {!loading && featuredArticles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold text-foreground">{isArabic ? 'الأكثر رواجاً' : 'Trending'}</h2>
            </div>
            <div className="relative">
              <AnimatePresence mode="wait">
                {featuredArticles.map((article, idx) => idx === featuredIndex && (
                  <motion.div key={article.id} onClick={() => openArticle(article)} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.4 }}
                    className="block relative overflow-hidden rounded-2xl border border-border/25 group cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <img src={getArticleImage(article)} alt={getTitle(article)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(e) => { (e.target as HTMLImageElement).src = categoryImages[article.category] || categoryImages.economy; }} />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      <div className="absolute top-3 start-3 flex items-center gap-2">
                        <Badge className="bg-orange-500/90 text-white border-none gap-1 rounded-lg text-[10px] backdrop-blur-sm">
                          <Flame className="w-3 h-3" /> {isArabic ? 'رائج' : 'Hot'}
                        </Badge>
                        <Badge variant="outline" className="bg-background/60 backdrop-blur-md border-border/30 rounded-lg text-[10px]">{article.source}</Badge>
                      </div>
                    </div>
                    <div className="absolute bottom-0 start-0 end-0 p-4">
                      <h3 className="text-base font-bold text-foreground leading-snug mb-2 line-clamp-2">{getTitle(article)}</h3>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground/70"><Clock className="w-3 h-3" />{timeAgo(article.pubDate)}</span>
                        <span className="text-xs text-primary flex items-center gap-1">{isArabic ? 'اقرأ المزيد' : 'Read more'} <ArrowUpRight className="w-3 h-3" /></span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {featuredArticles.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {featuredArticles.map((_, idx) => (
                    <button key={idx} onClick={() => setFeaturedIndex(idx)} className={cn("h-1.5 rounded-full transition-all", idx === featuredIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30")} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* News List */}
        {!loading && filteredNews.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-muted-foreground" /><h2 className="text-sm font-bold text-foreground">{isArabic ? 'آخر الأخبار' : 'Latest News'}</h2></div>
              {lastFetched && <span className="text-[10px] text-muted-foreground/50">{isArabic ? 'آخر تحديث: ' : 'Updated: '}{timeAgo(lastFetched.toISOString())}</span>}
            </div>
            <div className="space-y-2.5">
              {filteredNews.map((article, index) => {
                const catKey = (article.category as NewsCategory) || 'economy';
                const config = categoryConfig[catKey] || categoryConfig.economy;
                return (
                  <motion.div key={article.id} onClick={() => openArticle(article)} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                    className="group flex gap-3 p-3 rounded-2xl border border-border/25 bg-card/50 backdrop-blur-sm hover:border-border/40 transition-all cursor-pointer">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0">
                      <img src={getArticleImage(article)} alt={getTitle(article)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => { (e.target as HTMLImageElement).src = categoryImages[article.category] || categoryImages.economy; }} />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 rounded-md border-current/20", config.color)}>
                            {categories.find(c => c.key === catKey) ? (isArabic ? categories.find(c => c.key === catKey)?.labelAr : categories.find(c => c.key === catKey)?.labelEn) : article.category}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/60">{article.source}</span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">{getTitle(article)}</h3>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60 mt-1"><Clock className="w-3 h-3" />{timeAgo(article.pubDate)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
