import { Clock, AlertTriangle, Users, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportStatsProps {
  openCount: number;
  urgentCount: number;
  agentCount: number;
  closedCount: number;
  escalatedCount: number;
}

const SupportStats = ({ openCount, urgentCount, agentCount, closedCount, escalatedCount }: SupportStatsProps) => {
  const stats = [
    { label: 'مفتوحة', value: openCount, icon: Clock, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'عاجلة', value: urgentCount, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    { label: 'مصعّدة', value: escalatedCount, icon: ArrowUpRight, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'مغلقة', value: closedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'موظفين', value: agentCount, icon: Users, color: 'text-muted-foreground', bg: 'bg-muted/50 border-border/30' },
  ];

  return (
    <div className="grid grid-cols-5 gap-2 p-3">
      {stats.map((stat) => (
        <div key={stat.label} className={cn("p-2.5 rounded-xl border text-center transition-colors", stat.bg)}>
          <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
          <p className="text-lg font-bold">{stat.value}</p>
          <p className="text-[10px] text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

export default SupportStats;
