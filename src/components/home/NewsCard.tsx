import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Zap, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewsItem } from '@/types';
import { Badge } from '@/components/ui/badge';

interface NewsCardProps {
  news: NewsItem;
  onClick?: () => void;
}

export const NewsCard = ({ news, onClick }: NewsCardProps) => {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const title = isArabic ? news.title_ar : news.title_en;
  const content = isArabic ? news.content_ar : news.content_en;

  const timeAgo = () => {
    const diff = Date.now() - new Date(news.published_at).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m`;
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "p-3 rounded-lg border cursor-pointer transition-colors",
        news.is_breaking 
          ? "bg-gradient-to-r from-loss/10 to-transparent border-loss/30" 
          : "bg-card/50 border-border/30 hover:bg-card"
      )}
    >
      <div className="flex items-start gap-3">
        {news.is_breaking && (
          <div className="flex-shrink-0 p-1.5 rounded bg-loss/20">
            <Zap className="w-4 h-4 text-loss" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {news.is_breaking && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                BREAKING
              </Badge>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {timeAgo()}
            </span>
          </div>
          <h4 className="font-medium text-sm text-foreground line-clamp-2">{title}</h4>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{content}</p>
        </div>
      </div>
    </motion.div>
  );
};
