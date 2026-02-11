import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Newspaper, Calendar, FileText, RefreshCw, Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { NewsTab } from '@/components/news/NewsTab';
import { CalendarTab } from '@/components/news/CalendarTab';
import { ArticlesTab } from '@/components/news/ArticlesTab';

type MainTab = 'news' | 'calendar' | 'articles';

const NewsPage = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState<MainTab>('news');

  const tabs: { key: MainTab; labelAr: string; labelEn: string; icon: typeof Newspaper }[] = [
    { key: 'news', labelAr: 'الأخبار', labelEn: 'News', icon: Newspaper },
    { key: 'calendar', labelAr: 'التقويم الاقتصادي', labelEn: 'Economic Calendar', icon: Calendar },
    { key: 'articles', labelAr: 'المقالات', labelEn: 'Articles', icon: FileText },
  ];

  return (
    <AppLayout>
      {/* Main Tabs Header */}
      <header className="sticky top-0 z-40 glass-card border-b border-border/30">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-3.5 text-xs font-semibold transition-all whitespace-nowrap border-b-2 min-w-0",
                  activeTab === tab.key
                    ? "text-primary border-primary bg-primary/5"
                    : "text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/30"
                )}
              >
                <TabIcon className="w-4 h-4 shrink-0" />
                <span className="truncate">{isArabic ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Tab Content */}
      {activeTab === 'news' && <NewsTab />}
      {activeTab === 'calendar' && <CalendarTab />}
      {activeTab === 'articles' && <ArticlesTab />}
    </AppLayout>
  );
};

export default NewsPage;
