import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  UserPlus,
  Crown,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'trade' | 'user' | 'vip';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: typeof TrendingUp;
  color: string;
}

export const RecentActivity = () => {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  const fetchRecentActivity = async () => {
    setLoading(true);

    // Fetch recent trades
    const { data: trades } = await supabase
      .from('trades')
      .select('id, symbol, direction, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent users
    const { data: users } = await supabase
      .from('profiles')
      .select('id, display_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    const tradeActivities: ActivityItem[] = (trades || []).map(trade => ({
      id: `trade-${trade.id}`,
      type: 'trade' as const,
      title: t('admin.activity.newTrade'),
      subtitle: `${trade.symbol} - ${trade.direction.toUpperCase()}`,
      timestamp: trade.created_at,
      icon: trade.direction === 'buy' ? TrendingUp : TrendingDown,
      color: trade.direction === 'buy' ? 'text-profit' : 'text-loss'
    }));

    const userActivities: ActivityItem[] = (users || []).map(user => ({
      id: `user-${user.id}`,
      type: 'user' as const,
      title: t('admin.activity.newUser'),
      subtitle: user.display_name || t('admin.unnamed'),
      timestamp: user.created_at,
      icon: UserPlus,
      color: 'text-blue-500'
    }));

    // Combine and sort by timestamp
    const combined = [...tradeActivities, ...userActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    setActivities(combined);
    setLoading(false);
  };

  const formatTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), {
      addSuffix: true,
      locale: i18n.language === 'ar' ? ar : enUS
    });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-card/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {t('admin.activity.noActivity')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 p-3 rounded-lg bg-card/30 border border-border/20"
        >
          <div className={cn(
            "p-2 rounded-lg",
            activity.type === 'trade' 
              ? (activity.color === 'text-profit' ? 'bg-profit/10' : 'bg-loss/10')
              : 'bg-blue-500/10'
          )}>
            <activity.icon className={cn("w-4 h-4", activity.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {activity.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {activity.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span className="whitespace-nowrap">{formatTime(activity.timestamp)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
