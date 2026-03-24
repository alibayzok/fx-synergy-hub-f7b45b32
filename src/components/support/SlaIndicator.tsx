import { useEffect, useState } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SlaIndicatorProps {
  slaDeadline: string | null;
  slaBreached: boolean;
  firstResponseAt: string | null;
  status: string;
  compact?: boolean;
}

function getTimeRemaining(deadline: string): { text: string; urgency: 'safe' | 'warning' | 'danger' | 'breached' } {
  const now = Date.now();
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) {
    const overdue = Math.abs(diff);
    const mins = Math.floor(overdue / 60000);
    if (mins < 60) return { text: `متأخر ${mins} د`, urgency: 'breached' };
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return { text: `متأخر ${hrs} س`, urgency: 'breached' };
    return { text: `متأخر ${Math.floor(hrs / 24)} يوم`, urgency: 'breached' };
  }

  const mins = Math.floor(diff / 60000);
  if (mins < 10) return { text: `${mins} د متبقية`, urgency: 'danger' };
  if (mins < 30) return { text: `${mins} د`, urgency: 'warning' };
  if (mins < 60) return { text: `${mins} د`, urgency: 'safe' };
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return { text: `${hrs} س ${mins % 60} د`, urgency: 'safe' };
  return { text: `${Math.floor(hrs / 24)} يوم`, urgency: 'safe' };
}

const urgencyStyles = {
  safe: {
    badge: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
    icon: 'text-emerald-500',
    pulse: false,
  },
  warning: {
    badge: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
    icon: 'text-amber-500',
    pulse: false,
  },
  danger: {
    badge: 'bg-orange-500/15 text-orange-600 border-orange-500/30 animate-pulse',
    icon: 'text-orange-500',
    pulse: true,
  },
  breached: {
    badge: 'bg-destructive/15 text-destructive border-destructive/30',
    icon: 'text-destructive',
    pulse: true,
  },
};

const SlaIndicator = ({ slaDeadline, slaBreached, firstResponseAt, status, compact = false }: SlaIndicatorProps) => {
  const [timeInfo, setTimeInfo] = useState<ReturnType<typeof getTimeRemaining> | null>(null);

  useEffect(() => {
    if (!slaDeadline || status !== 'open') return;

    const update = () => setTimeInfo(getTimeRemaining(slaDeadline));
    update();
    const interval = setInterval(update, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [slaDeadline, status]);

  if (status !== 'open' || !slaDeadline) {
    if (firstResponseAt && status === 'closed') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-600">
                <CheckCircle2 className="w-2.5 h-2.5" />
                {compact ? 'تم' : 'تم الرد'}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">وقت الاستجابة الأولى: {formatResponseTime(firstResponseAt, slaDeadline)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    return null;
  }

  if (!timeInfo) return null;

  const style = urgencyStyles[timeInfo.urgency];
  const Icon = timeInfo.urgency === 'breached' ? AlertTriangle : timeInfo.urgency === 'danger' ? Timer : Clock;

  if (compact) {
    return (
      <Badge variant="outline" className={cn("text-[10px] gap-1 border", style.badge)}>
        <Icon className={cn("w-2.5 h-2.5", style.icon)} />
        {timeInfo.text}
      </Badge>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className={cn("text-xs gap-1.5 border px-2 py-0.5", style.badge)}>
            <Icon className={cn("w-3 h-3", style.icon)} />
            <span>{timeInfo.text}</span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-xs space-y-1">
            <p>⏰ موعد SLA: {new Date(slaDeadline).toLocaleString('ar-SA')}</p>
            {firstResponseAt && <p>✅ أول رد: {formatResponseTime(firstResponseAt, slaDeadline)}</p>}
            {slaBreached && <p className="text-destructive font-medium">⚠️ تم تجاوز وقت SLA</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

function formatResponseTime(firstResponseAt: string, slaDeadline: string): string {
  const created = new Date(slaDeadline).getTime();
  const responded = new Date(firstResponseAt).getTime();
  const diff = responded - created;
  const mins = Math.floor(Math.abs(diff) / 60000);
  if (mins < 60) return `${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} ساعة ${mins % 60} دقيقة`;
}

export default SlaIndicator;
