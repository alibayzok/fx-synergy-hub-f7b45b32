import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, TrendingUp, Globe, Clock, Search, 
  Bookmark, BookmarkCheck, ChevronLeft, ChevronRight,
  Flame, Star, Eye, ExternalLink, Sparkles, ArrowUpRight
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NewsCategory = 'all' | 'forex' | 'crypto' | 'economy' | 'stocks';

interface NewsArticle {
  id: string;
  title: string;
  titleAr: string;
  summary: string;
  summaryAr: string;
  category: NewsCategory;
  source: string;
  imageUrl: string;
  timeAgo: string;
  timeAgoAr: string;
  isFeatured: boolean;
  isHot: boolean;
  readTime: string;
  readTimeAr: string;
  views: number;
}

// Mock news data - in production this would come from an API
const mockNews: NewsArticle[] = [
  {
    id: '1',
    title: 'Gold Surges Past $2,800 as Global Uncertainty Rises',
    titleAr: 'الذهب يقفز فوق 2,800$ مع تصاعد حالة عدم اليقين العالمية',
    summary: 'Gold prices hit new all-time highs as investors flock to safe-haven assets amid escalating geopolitical tensions and inflation concerns.',
    summaryAr: 'أسعار الذهب تسجل مستويات قياسية جديدة مع لجوء المستثمرين إلى أصول الملاذ الآمن وسط تصاعد التوترات الجيوسياسية ومخاوف التضخم.',
    category: 'forex',
    source: 'Reuters',
    imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80',
    timeAgo: '2h ago',
    timeAgoAr: 'منذ ساعتين',
    isFeatured: true,
    isHot: true,
    readTime: '4 min',
    readTimeAr: '4 دقائق',
    views: 12400,
  },
  {
    id: '2',
    title: 'Bitcoin Breaks $120K Barrier in Historic Rally',
    titleAr: 'البيتكوين يكسر حاجز 120 ألف دولار في ارتفاع تاريخي',
    summary: 'The world\'s largest cryptocurrency reaches unprecedented levels, driven by institutional adoption and ETF inflows.',
    summaryAr: 'أكبر عملة رقمية في العالم تصل إلى مستويات غير مسبوقة مدفوعة بتبني المؤسسات وتدفقات صناديق ETF.',
    category: 'crypto',
    source: 'CoinDesk',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800&q=80',
    timeAgo: '4h ago',
    timeAgoAr: 'منذ 4 ساعات',
    isFeatured: true,
    isHot: true,
    readTime: '5 min',
    readTimeAr: '5 دقائق',
    views: 28300,
  },
  {
    id: '3',
    title: 'Federal Reserve Signals Rate Cuts Ahead',
    titleAr: 'الفيدرالي الأمريكي يلمّح لخفض أسعار الفائدة',
    summary: 'Fed Chair hints at potential rate cuts in upcoming meetings as inflation shows signs of cooling.',
    summaryAr: 'رئيس الاحتياطي الفيدرالي يلمّح لإمكانية خفض أسعار الفائدة في الاجتماعات القادمة مع تراجع التضخم.',
    category: 'economy',
    source: 'Bloomberg',
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80',
    timeAgo: '5h ago',
    timeAgoAr: 'منذ 5 ساعات',
    isFeatured: false,
    isHot: false,
    readTime: '3 min',
    readTimeAr: '3 دقائق',
    views: 8900,
  },
  {
    id: '4',
    title: 'EUR/USD Hits 6-Month High on Dollar Weakness',
    titleAr: 'اليورو/دولار يبلغ أعلى مستوى في 6 أشهر مع ضعف الدولار',
    summary: 'The euro strengthens significantly against the dollar as diverging monetary policies take effect.',
    summaryAr: 'اليورو يرتفع بشكل ملحوظ مقابل الدولار مع تأثير السياسات النقدية المتباينة.',
    category: 'forex',
    source: 'FXStreet',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    timeAgo: '6h ago',
    timeAgoAr: 'منذ 6 ساعات',
    isFeatured: false,
    isHot: false,
    readTime: '3 min',
    readTimeAr: '3 دقائق',
    views: 5600,
  },
  {
    id: '5',
    title: 'Oil Prices Drop as OPEC+ Considers Output Increase',
    titleAr: 'أسعار النفط تتراجع مع دراسة أوبك+ زيادة الإنتاج',
    summary: 'Crude oil falls as OPEC+ members discuss potential production increases to stabilize the market.',
    summaryAr: 'النفط الخام ينخفض مع مناقشة أعضاء أوبك+ زيادة محتملة في الإنتاج لتحقيق استقرار السوق.',
    category: 'economy',
    source: 'CNBC',
    imageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80',
    timeAgo: '8h ago',
    timeAgoAr: 'منذ 8 ساعات',
    isFeatured: false,
    isHot: false,
    readTime: '4 min',
    readTimeAr: '4 دقائق',
    views: 7200,
  },
  {
    id: '6',
    title: 'Ethereum 2.0 Staking Rewards Hit Record High',
    titleAr: 'عوائد تخزين إيثريوم 2.0 تسجل مستويات قياسية',
    summary: 'ETH staking yields surge as network activity reaches new peaks, attracting more validators.',
    summaryAr: 'عوائد تخزين ETH ترتفع بشكل حاد مع وصول نشاط الشبكة لمستويات جديدة.',
    category: 'crypto',
    source: 'The Block',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    timeAgo: '10h ago',
    timeAgoAr: 'منذ 10 ساعات',
    isFeatured: false,
    isHot: false,
    readTime: '3 min',
    readTimeAr: '3 دقائق',
    views: 4100,
  },
  {
    id: '7',
    title: 'S&P 500 Reaches New All-Time High',
    titleAr: 'مؤشر S&P 500 يسجل قمة تاريخية جديدة',
    summary: 'US stock market continues its bull run with tech sector leading the rally.',
    summaryAr: 'سوق الأسهم الأمريكي يواصل ارتفاعه مع قيادة قطاع التكنولوجيا للصعود.',
    category: 'stocks',
    source: 'WSJ',
    imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80',
    timeAgo: '12h ago',
    timeAgoAr: 'منذ 12 ساعة',
    isFeatured: false,
    isHot: false,
    readTime: '4 min',
    readTimeAr: '4 دقائق',
    views: 9800,
  },
  {
    id: '8',
    title: 'Japanese Yen Weakens as BOJ Maintains Ultra-Low Rates',
    titleAr: 'الين الياباني يتراجع مع إبقاء بنك اليابان على معدلات فائدة منخفضة',
    summary: 'USD/JPY climbs as the Bank of Japan continues its accommodative monetary policy stance.',
    summaryAr: 'الدولار/ين يرتفع مع استمرار بنك اليابان في سياسته النقدية التيسيرية.',
    category: 'forex',
    source: 'Nikkei',
    imageUrl: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=800&q=80',
    timeAgo: '14h ago',
    timeAgoAr: 'منذ 14 ساعة',
    isFeatured: false,
    isHot: false,
    readTime: '3 min',
    readTimeAr: '3 دقائق',
    views: 3400,
  },
];

const categoryConfig: Record<NewsCategory, { icon: typeof Globe; color: string; gradient: string }> = {
  all: { icon: Globe, color: 'text-primary', gradient: 'from-primary/20 to-primary/5' },
  forex: { icon: TrendingUp, color: 'text-emerald-400', gradient: 'from-emerald-500/20 to-emerald-500/5' },
  crypto: { icon: Sparkles, color: 'text-amber-400', gradient: 'from-amber-500/20 to-amber-500/5' },
  economy: { icon: Globe, color: 'text-blue-400', gradient: 'from-blue-500/20 to-blue-500/5' },
  stocks: { icon: TrendingUp, color: 'text-purple-400', gradient: 'from-purple-500/20 to-purple-500/5' },
};

const NewsPage = () => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [activeCategory, setActiveCategory] = useState<NewsCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [savedArticles, setSavedArticles] = useState<string[]>([]);
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const featuredArticles = mockNews.filter(n => n.isFeatured);
  const filteredNews = mockNews.filter(n => {
    const matchesCategory = activeCategory === 'all' || n.category === activeCategory;
    const title = isArabic ? n.titleAr : n.title;
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && !n.isFeatured;
  });

  const toggleSave = (id: string) => {
    setSavedArticles(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  // Auto-rotate featured articles
  useEffect(() => {
    if (featuredArticles.length <= 1) return;
    const timer = setInterval(() => {
      setFeaturedIndex(i => (i + 1) % featuredArticles.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredArticles.length]);

  const categories: { key: NewsCategory; labelAr: string; labelEn: string }[] = [
    { key: 'all', labelAr: 'الكل', labelEn: 'All' },
    { key: 'forex', labelAr: 'فوركس', labelEn: 'Forex' },
    { key: 'crypto', labelAr: 'كريبتو', labelEn: 'Crypto' },
    { key: 'economy', labelAr: 'اقتصاد', labelEn: 'Economy' },
    { key: 'stocks', labelAr: 'أسهم', labelEn: 'Stocks' },
  ];

  const formatViews = (views: number) => {
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  return (
    <AppLayout>
      {/* Premium Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                <Newspaper className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{t('news.title')}</h1>
                <p className="text-[10px] text-muted-foreground/60">{t('news.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-profit/10 border border-profit/20">
                <div className="w-1.5 h-1.5 rounded-full bg-profit animate-pulse" />
                <span className="text-[10px] font-medium text-profit">LIVE</span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('news.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10 rounded-xl bg-muted/50 border-border/30 focus:border-primary/40"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
          {categories.map((cat) => {
            const config = categoryConfig[cat.key];
            const CatIcon = config.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                  activeCategory === cat.key
                    ? `bg-gradient-to-r ${config.gradient} ${config.color} border-current/20 shadow-sm`
                    : "bg-card/30 text-muted-foreground border-border/20 hover:bg-card/60"
                )}
              >
                <CatIcon className="w-3.5 h-3.5" />
                {isArabic ? cat.labelAr : cat.labelEn}
              </button>
            );
          })}
        </div>
      </header>

      <div className="px-4 py-4 space-y-5">
        {/* Featured News Carousel */}
        {activeCategory === 'all' && featuredArticles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-bold text-foreground">{t('news.trending')}</h2>
            </div>
            <div className="relative">
              <AnimatePresence mode="wait">
                {featuredArticles.map((article, idx) => idx === featuredIndex && (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.4 }}
                    className="relative overflow-hidden rounded-2xl border border-border/25 group"
                  >
                    {/* Image */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={article.imageUrl}
                        alt={isArabic ? article.titleAr : article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                      
                      {/* Top badges */}
                      <div className="absolute top-3 start-3 flex items-center gap-2">
                        {article.isHot && (
                          <Badge className="bg-orange-500/90 text-white border-none gap-1 rounded-lg text-[10px] backdrop-blur-sm">
                            <Flame className="w-3 h-3" /> {isArabic ? 'رائج' : 'Hot'}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-background/60 backdrop-blur-md border-border/30 rounded-lg text-[10px]">
                          {article.source}
                        </Badge>
                      </div>

                      {/* Save */}
                      <button
                        onClick={() => toggleSave(article.id)}
                        className="absolute top-3 end-3 p-2 rounded-xl bg-background/40 backdrop-blur-md border border-border/20 hover:bg-background/60 transition-all"
                      >
                        {savedArticles.includes(article.id)
                          ? <BookmarkCheck className="w-4 h-4 text-primary" />
                          : <Bookmark className="w-4 h-4 text-foreground/70" />}
                      </button>
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 start-0 end-0 p-4">
                      <h3 className="text-base font-bold text-foreground leading-snug mb-2">
                        {isArabic ? article.titleAr : article.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isArabic ? article.timeAgoAr : article.timeAgo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span className="trading-number">{formatViews(article.views)}</span>
                          </span>
                        </div>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary hover:text-primary">
                          {isArabic ? 'اقرأ المزيد' : 'Read more'} <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Carousel Dots */}
              {featuredArticles.length > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  {featuredArticles.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFeaturedIndex(idx)}
                      className={cn(
                        "h-1.5 rounded-full transition-all",
                        idx === featuredIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Latest News */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">{t('news.latest')}</h2>
          </div>

          {filteredNews.length > 0 ? (
            <div className="space-y-3">
              {filteredNews.map((article, index) => {
                const config = categoryConfig[article.category];
                return (
                  <motion.div
                    key={article.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex gap-3 p-3 rounded-2xl border border-border/25 bg-card/50 backdrop-blur-sm hover:border-border/40 hover:scale-[1.01] transition-all cursor-pointer"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
                      <img
                        src={article.imageUrl}
                        alt={isArabic ? article.titleAr : article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] px-1.5 py-0 rounded-md border-current/20",
                              config.color
                            )}
                          >
                            {isArabic ? categories.find(c => c.key === article.category)?.labelAr : categories.find(c => c.key === article.category)?.labelEn}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground/60">{article.source}</span>
                        </div>
                        <h3 className="text-sm font-bold text-foreground leading-snug line-clamp-2">
                          {isArabic ? article.titleAr : article.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between mt-1.5">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/60">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {isArabic ? article.timeAgoAr : article.timeAgo}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span className="trading-number">{formatViews(article.views)}</span>
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleSave(article.id); }}
                          className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          {savedArticles.includes(article.id)
                            ? <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                            : <Bookmark className="w-3.5 h-3.5 text-muted-foreground/50" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="p-4 rounded-2xl bg-muted/30 mb-4">
                <Newspaper className="w-10 h-10 text-muted-foreground/40" />
              </div>
              <p className="text-muted-foreground font-medium">{t('news.noArticles')}</p>
              <p className="text-sm text-muted-foreground/60 mt-1">{t('news.checkLater')}</p>
            </motion.div>
          )}
        </div>

        {/* Market Pulse */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/15"
        >
          <div className="absolute top-0 end-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">{t('news.marketPulse')}</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'XAU/USD', value: '2,847', change: '+1.8%', up: true },
                { label: 'BTC/USD', value: '120,450', change: '+4.2%', up: true },
                { label: 'EUR/USD', value: '1.1245', change: '+0.3%', up: true },
              ].map((item, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-background/50 backdrop-blur-sm border border-border/20 text-center">
                  <p className="text-[10px] text-muted-foreground/70 mb-0.5">{item.label}</p>
                  <p className="text-xs font-bold trading-number text-foreground">{item.value}</p>
                  <p className={cn("text-[10px] font-semibold trading-number", item.up ? "text-profit" : "text-loss")}>
                    {item.change}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Disclaimer */}
        <p className="text-center text-[10px] text-muted-foreground/40 pb-2">
          {t('disclaimer.text')}
        </p>
      </div>
    </AppLayout>
  );
};

export default NewsPage;
