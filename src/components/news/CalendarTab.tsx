import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toLatinNumerals } from '@/lib/date-utils';

interface CalendarEvent {
  id: string;
  time: string;
  currency: string;
  impact: 'low' | 'medium' | 'high';
  event: string;
  event_ar: string;
  actual: string;
  forecast: string;
  previous: string;
  date: string;
}

const impactColors = {
  high: 'bg-destructive',
  medium: 'bg-amber-500',
  low: 'bg-muted-foreground/40',
};

const impactLabels = {
  high: { ar: 'عالي', en: 'High' },
  medium: { ar: 'متوسط', en: 'Medium' },
  low: { ar: 'منخفض', en: 'Low' },
};

const currencyFlags: Record<string, string> = {
  USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CHF: '🇨🇭',
  AUD: '🇦🇺', CAD: '🇨🇦', NZD: '🇳🇿', CNY: '🇨🇳',
};

export const CalendarTab = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterImpact, setFilterImpact] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fetchCalendar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('fetch-calendar', {
        body: {},
      });
      if (fnError) throw fnError;
      if (data?.success && data?.data) {
        setEvents(data.data);
      } else {
        throw new Error(data?.error || 'Failed');
      }
    } catch (err: any) {
      console.error('Calendar error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar();
  }, []);

  const filteredEvents = filterImpact === 'all' ? events : events.filter(e => e.impact === filterImpact);

  // Group events by date
  const groupedEvents = filteredEvents.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
    const dateKey = event.date || 'unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});

  const formatDateHeader = (dateStr: string) => {
    if (!dateStr || dateStr === 'unknown') return '';
    try {
      const date = new Date(dateStr + 'T00:00:00');
      const locale = isArabic ? 'ar-EG' : 'en-US';
      const dayName = date.toLocaleDateString(locale, { weekday: 'long' });
      const formatted = date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
      return { dayName: toLatinNumerals(dayName), fullDate: toLatinNumerals(formatted) };
    } catch {
      return { dayName: '', fullDate: dateStr };
    }
  };

  return (
    <div className="py-2 space-y-3">
      {/* Header */}
      <div className="px-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          {isArabic ? 'التقويم الاقتصادي' : 'Economic Calendar'}
        </h2>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={fetchCalendar} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Impact Filter */}
      <div className="px-4 flex gap-1.5">
        {(['all', 'high', 'medium', 'low'] as const).map((impact) => (
          <button
            key={impact}
            onClick={() => setFilterImpact(impact)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              filterImpact === impact
                ? impact === 'all'
                  ? 'bg-primary/10 text-primary border-primary/20'
                  : `bg-${impact === 'high' ? 'destructive' : 'amber-500'}/10 ${impact === 'high' ? 'text-destructive border-destructive/30' : impact === 'medium' ? 'text-amber-500 border-amber-500/30' : 'text-muted-foreground border-border/30'}`
                : "bg-card/30 text-muted-foreground border-border/20"
            )}
          >
            {impact === 'all'
              ? (isArabic ? 'الكل' : 'All')
              : (isArabic ? impactLabels[impact].ar : impactLabels[impact].en)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">{isArabic ? 'جاري تحميل التقويم...' : 'Loading calendar...'}</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && events.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <div className="p-4 rounded-2xl bg-destructive/10 mb-4"><AlertCircle className="w-8 h-8 text-destructive" /></div>
          <Button onClick={fetchCalendar} size="sm" className="gap-2"><RefreshCw className="w-3.5 h-3.5" />{isArabic ? 'إعادة المحاولة' : 'Retry'}</Button>
        </div>
      )}

      {/* Events grouped by date */}
      {!loading && Object.keys(groupedEvents).length > 0 && (
        <div className="space-y-0">
          {Object.entries(groupedEvents).map(([dateKey, dateEvents], groupIndex) => {
            const dateInfo = formatDateHeader(dateKey);
            return (
              <motion.div
                key={dateKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: groupIndex * 0.05 }}
              >
                {/* Date Header Row */}
                <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-y border-border/30">
                  <span className="text-sm font-bold text-foreground">
                    {typeof dateInfo === 'object' ? dateInfo.dayName : ''}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground">
                    {typeof dateInfo === 'object' ? dateInfo.fullDate : dateInfo}
                  </span>
                </div>

                {/* Events under this date */}
                <div className="divide-y divide-border/20">
                  {dateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors"
                    >
                      {/* Impact indicator */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className={cn("w-2.5 h-2.5 rounded-full", impactColors[event.impact])} />
                      </div>

                      {/* Event info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground leading-snug truncate">
                          {isArabic && event.event_ar ? event.event_ar : event.event}
                        </p>
                        {/* Values row */}
                        <div className="flex items-center gap-3 mt-1">
                          {event.actual && event.actual !== '-' && (
                            <span className="text-[10px] text-muted-foreground">
                              {toLatinNumerals(event.actual)} {isArabic ? 'فعلي' : 'actual'}
                            </span>
                          )}
                          {event.forecast && event.forecast !== '-' && (
                            <span className="text-[10px] text-muted-foreground">
                              {toLatinNumerals(event.forecast)} {isArabic ? 'متوقع' : 'forecast'}
                            </span>
                          )}
                          {event.previous && event.previous !== '-' && (
                            <span className="text-[10px] text-muted-foreground">
                              {toLatinNumerals(event.previous)} {isArabic ? 'السابق' : 'previous'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Time + Flag */}
                      <div className="shrink-0 flex items-center gap-2">
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {toLatinNumerals(event.time)}
                        </span>
                        <span className="text-lg">{currencyFlags[event.currency] || '🏳️'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {!loading && filteredEvents.length === 0 && events.length > 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">{isArabic ? 'لا توجد أحداث بهذا التصنيف' : 'No events with this filter'}</p>
        </div>
      )}
    </div>
  );
};
