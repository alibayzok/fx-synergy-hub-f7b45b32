import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Crown, 
  BarChart3,
  CheckCircle2,
  XCircle,
  Clock,
  Activity
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Stats {
  totalUsers: number;
  vipUsers: number;
  totalTrades: number;
  activeTrades: number;
  winningTrades: number;
  losingTrades: number;
}

export const DashboardStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    vipUsers: 0,
    totalTrades: 0,
    activeTrades: 0,
    winningTrades: 0,
    losingTrades: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);

    // Fetch profiles count
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Fetch VIP users count
    const { count: vipCount } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'vip');

    // Fetch trades
    const { data: trades } = await supabase
      .from('trades')
      .select('status');

    const activeTrades = trades?.filter(t => 
      t.status === 'pending' || t.status === 'running'
    ).length || 0;

    const winningTrades = trades?.filter(t => t.status === 'tp_hit').length || 0;
    const losingTrades = trades?.filter(t => t.status === 'sl_hit').length || 0;

    setStats({
      totalUsers: profilesCount || 0,
      vipUsers: vipCount || 0,
      totalTrades: trades?.length || 0,
      activeTrades,
      winningTrades,
      losingTrades
    });

    setLoading(false);
  };

  const statCards = [
    {
      label: t('admin.stats.totalUsers'),
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      label: t('admin.stats.vipUsers'),
      value: stats.vipUsers,
      icon: Crown,
      color: 'text-vip',
      bgColor: 'bg-vip/10'
    },
    {
      label: t('admin.stats.totalTrades'),
      value: stats.totalTrades,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      label: t('admin.stats.activeTrades'),
      value: stats.activeTrades,
      icon: Activity,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      label: t('admin.stats.winningTrades'),
      value: stats.winningTrades,
      icon: CheckCircle2,
      color: 'text-profit',
      bgColor: 'bg-profit/10'
    },
    {
      label: t('admin.stats.losingTrades'),
      value: stats.losingTrades,
      icon: XCircle,
      color: 'text-loss',
      bgColor: 'bg-loss/10'
    }
  ];

  const winRate = stats.winningTrades + stats.losingTrades > 0 
    ? Math.round((stats.winningTrades / (stats.winningTrades + stats.losingTrades)) * 100) 
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-card/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-card/50 border border-border/30"
          >
            <div className="flex items-center gap-3">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground trading-number">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Win Rate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-profit/10 border border-primary/30"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/20">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('admin.stats.winRate')}</p>
              <p className="text-3xl font-bold text-foreground trading-number">{winRate}%</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t('admin.stats.closedTrades')}</p>
            <p className="text-lg font-semibold text-foreground trading-number">
              {stats.winningTrades + stats.losingTrades}
            </p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-profit to-primary rounded-full transition-all duration-500"
            style={{ width: `${winRate}%` }}
          />
        </div>
      </motion.div>
    </div>
  );
};
