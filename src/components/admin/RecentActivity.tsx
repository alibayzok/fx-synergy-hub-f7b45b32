import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FileText, UserPlus, Clock, ChevronLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface ActivityItem {
  id: string;
  type: 'signal' | 'user';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: typeof FileText;
  color: string;
  bgColor: string;
}

export const RecentActivity = () => {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRecentActivity(); }, []);

  const fetchRecentActivity = async () => {
    setLoading(true);

    const [analysesRes, usersRes] = await Promise.all([
      supabase.from('analyses').select('id, title, created_at').order('created_at', { ascending: false }).limit(5),
      supabase.from('profiles').select('id, display_name, created_at').order('created_at', { ascending: false }).limit(5),
    ]);

    const signalActivities: ActivityItem[] = (analysesRes.data || []).map(a => ({
      id: `signal-${a.id}`,
      type: 'signal',
      title: 'إشارة جديدة',
      subtitle: a.title,
      timestamp: a.created_at,
      icon: FileText,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15',
    }));

    const userActivities: ActivityItem[] = (usersRes.data || []).map(u => ({
      id: `user-${u.id}`,
      type: 'user',
      title: t('admin.activity.newUser'),
      subtitle: u.display_name || t('admin.unnamed'),
      timestamp: u.created_at,
      icon: UserPlus,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/15',
    }));

    const combined = [...signalActivities, ...userActivities]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    setActivities(combined);
    setLoading(false);
  };

  const formatTime = (timestamp: string) => formatDistanceToNow(new Date(timestamp), { addSuffix: true, locale: i18n.language === 'ar' ? ar : enUS });

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-card/30 animate-pulse border border-border/10" />
      ))}
    </div>
  );

  if (activities.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
      <p className="text-sm">{t('admin.activity.noActivity')}</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "group flex items-center gap-3 p-3 rounded-xl",
            "bg-card/40 border border-border/10",
            "hover:bg-card/70 hover:border-border/30 transition-all duration-200"
          )}
        >
          <div className={cn("p-2 rounded-lg shrink-0", activity.bgColor)}>
            <activity.icon className={cn("w-4 h-4", activity.color)} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{activity.title}</p>
            <p className="text-xs text-muted-foreground truncate">{activity.subtitle}</p>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70 shrink-0">
            <Clock className="w-3 h-3" />
            <span className="whitespace-nowrap">{formatTime(activity.timestamp)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
