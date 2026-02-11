import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, Crown, FileText, Activity, TrendingUp, Signal, MessageSquare, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  vipUsers: number;
  totalSignals: number;
  totalPosts: number;
  totalTickets: number;
  pendingRequests: number;
}

export const DashboardStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, vipUsers: 0, totalSignals: 0, totalPosts: 0, totalTickets: 0, pendingRequests: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    const [profiles, vip, signals, posts, tickets, requests] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'vip'),
      supabase.from('signals').select('*', { count: 'exact', head: true }),
      supabase.from('user_posts').select('*', { count: 'exact', head: true }),
      supabase.from('support_tickets').select('*', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('service_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ]);

    setStats({
      totalUsers: profiles.count || 0,
      vipUsers: vip.count || 0,
      totalSignals: signals.count || 0,
      totalPosts: posts.count || 0,
      totalTickets: tickets.count || 0,
      pendingRequests: requests.count || 0,
    });
    setLoading(false);
  };

  const statCards = [
    { 
      label: t('admin.stats.totalUsers'), 
      value: stats.totalUsers, 
      icon: Users, 
      gradient: 'from-blue-500/20 via-blue-600/10 to-transparent',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    { 
      label: t('admin.stats.vipUsers'), 
      value: stats.vipUsers, 
      icon: Crown, 
      gradient: 'from-amber-500/20 via-amber-600/10 to-transparent',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
    { 
      label: 'الإشارات', 
      value: stats.totalSignals, 
      icon: Signal, 
      gradient: 'from-emerald-500/20 via-emerald-600/10 to-transparent',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
    { 
      label: 'المنشورات', 
      value: stats.totalPosts, 
      icon: MessageSquare, 
      gradient: 'from-purple-500/20 via-purple-600/10 to-transparent',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/20',
    },
    { 
      label: 'تذاكر مفتوحة', 
      value: stats.totalTickets, 
      icon: ShieldCheck, 
      gradient: 'from-rose-500/20 via-rose-600/10 to-transparent',
      iconBg: 'bg-rose-500/20',
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/20',
    },
    { 
      label: 'طلبات معلقة', 
      value: stats.pendingRequests, 
      icon: Activity, 
      gradient: 'from-orange-500/20 via-orange-600/10 to-transparent',
      iconBg: 'bg-orange-500/20',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-card/50 animate-pulse border border-border/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: index * 0.07, type: 'spring', stiffness: 200 }}
          className={cn(
            "relative overflow-hidden p-4 rounded-2xl border backdrop-blur-sm",
            "bg-gradient-to-br",
            stat.gradient,
            stat.borderColor,
            "hover:scale-[1.02] transition-transform duration-200 cursor-default"
          )}
        >
          {/* Decorative glow */}
          <div className={cn(
            "absolute -top-6 -end-6 w-20 h-20 rounded-full blur-2xl opacity-30",
            stat.iconBg
          )} />
          
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-3xl font-extrabold text-foreground tracking-tight trading-number">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
            </div>
            <div className={cn("p-2.5 rounded-xl", stat.iconBg)}>
              <stat.icon className={cn("w-5 h-5", stat.iconColor)} />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
