import { Clock, AlertTriangle, Users, CheckCircle2, ArrowUpRight, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportStatsProps {
  openCount: number;
  urgentCount: number;
  agentCount: number;
  closedCount: number;
  escalatedCount: number;
  slaBreachedCount?: number;
  avgResponseTime?: string;
}

const SupportStats = ({ openCount, urgentCount, agentCount, closedCount, escalatedCount, slaBreachedCount = 0, avgResponseTime }: SupportStatsProps) => {
  const stats = [
    { label: 'مفتوحة', value: openCount, icon: Clock, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'عاجلة', value: urgentCount, icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
    { label: 'تجاوز SLA', value: slaBreachedCount, icon: Timer, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/20' },
    { label: 'مصعّدة', value: escalatedCount, icon: ArrowUpRight, color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' },
    { label: 'مغلقة', value: closedCount, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    { label: 'موظفين', value: agentCount, icon: Users, color: 'text-muted-foreground', bg: 'bg-muted/50 border-border/30' },
  ];

  return (
    <div className="p-3 space-y-2">
      <div className="grid grid-cols-6 gap-2">
        {stats.map((stat) => (
          <div key={stat.label} className={cn("p-2.5 rounded-xl border text-center transition-colors", stat.bg)}>
            <stat.icon className={cn("w-4 h-4 mx-auto mb-1", stat.color)} />
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>
      {avgResponseTime && (
        <div className="text-center text-xs text-muted-foreground">
          ⏱ متوسط وقت الاستجابة: <span className="font-medium text-foreground">{avgResponseTime}</span>
        </div>
      )}
    </div>
  );
};

export default SupportStats;
