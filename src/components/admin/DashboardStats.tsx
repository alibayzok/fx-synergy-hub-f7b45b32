import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Crown, FileText, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  vipUsers: number;
  totalAnalyses: number;
  totalPosts: number;
}

export const DashboardStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, vipUsers: 0, totalAnalyses: 0, totalPosts: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { count: profilesCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: vipCount } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'vip');
    const { count: analysesCount } = await supabase.from('analyses').select('*', { count: 'exact', head: true });
    const { count: postsCount } = await supabase.from('user_posts').select('*', { count: 'exact', head: true });

    setStats({
      totalUsers: profilesCount || 0,
      vipUsers: vipCount || 0,
      totalAnalyses: analysesCount || 0,
      totalPosts: postsCount || 0,
    });
    setLoading(false);
  };

  const statCards = [
    { label: t('admin.stats.totalUsers'), value: stats.totalUsers, icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    { label: t('admin.stats.vipUsers'), value: stats.vipUsers, icon: Crown, color: 'text-vip', bgColor: 'bg-vip/10' },
    { label: 'إجمالي الإشارات', value: stats.totalAnalyses, icon: FileText, color: 'text-primary', bgColor: 'bg-primary/10' },
    { label: 'إجمالي المنشورات', value: stats.totalPosts, icon: Activity, color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (<div key={i} className="h-24 rounded-xl bg-card/50 animate-pulse" />))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {statCards.map((stat, index) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="p-4 rounded-xl bg-card/50 border border-border/30">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", stat.bgColor)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground trading-number">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
