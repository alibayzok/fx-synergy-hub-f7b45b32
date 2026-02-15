import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Calendar, Clock, RefreshCw, Loader2, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

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

const impactConfig = {
  high: { color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label_ar: 'عالي', label_en: 'High' },
  medium: { color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label_ar: 'متوسط', label_en: 'Medium' },
  low: { color: 'text-muted-foreground', bg: 'bg-muted/30', border: 'border-border/30', label_ar: 'منخفض', label_en: 'Low' },
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
  const [calendarDate, setCalendarDate] = useState('');

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
        setCalendarDate(data.date || new Date().toISOString().split('T')[0]);
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

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return dateStr; }
  };

  return (
    <div className="px-4 py-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {isArabic ? 'التقويم الاقتصادي' : 'Economic Calendar'}
          </h2>
          {calendarDate && (
            <p className="text-xs text-muted-foreground mt-0.5">{formatDateDisplay(calendarDate)}</p>
          )}
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={fetchCalendar} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        </Button>
      </div>

      {/* Impact Filter */}
      <div className="flex gap-1.5">
        {(['all', 'high', 'medium', 'low'] as const).map((impact) => (
          <button
            key={impact}
            onClick={() => setFilterImpact(impact)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border",
              filterImpact === impact
                ? impact === 'all' ? 'bg-primary/10 text-primary border-primary/20' 
                  : `${impactConfig[impact].bg} ${impactConfig[impact].color} ${impactConfig[impact].border}`
                : "bg-card/30 text-muted-foreground border-border/20"
            )}
          >
            {impact === 'all' ? (isArabic ? 'الكل' : 'All') 
              : (isArabic ? impactConfig[impact].label_ar : impactConfig[impact].label_en)}
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

      {/* Events */}
      {!loading && filteredEvents.length > 0 && (
        <div className="space-y-2">
          {filteredEvents.map((event, index) => {
            const impact = impactConfig[event.impact];
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className={cn(
                  "p-3 rounded-xl border transition-all",
                  impact.bg, impact.border
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Time + Currency */}
                  <div className="shrink-0 text-center w-14">
                    <p className="text-xs font-bold trading-number text-foreground">{event.time}</p>
                    <p className="text-lg mt-0.5">{currencyFlags[event.currency] || '🏳️'}</p>
                    <p className="text-[10px] font-semibold text-muted-foreground trading-number">{event.currency}</p>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className={cn("w-2 h-2 rounded-full", 
                        event.impact === 'high' ? 'bg-destructive' : event.impact === 'medium' ? 'bg-amber-500' : 'bg-muted-foreground/40'
                      )} />
                      <span className={cn("text-[10px] font-semibold", impact.color)}>
                        {isArabic ? impact.label_ar : impact.label_en}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">
                      {isArabic && event.event_ar ? event.event_ar : event.event}
                    </h3>
                    
                    {/* Values */}
                    <div className="flex items-center gap-4 mt-2">
                      <div>
                        <p className="text-[9px] text-muted-foreground/60">{isArabic ? 'الفعلي' : 'Actual'}</p>
                        <p className={cn("text-xs font-bold trading-number", event.actual !== '-' ? 'text-foreground' : 'text-muted-foreground')}>
                          {event.actual}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground/60">{isArabic ? 'التوقع' : 'Forecast'}</p>
                        <p className="text-xs font-semibold text-muted-foreground trading-number">{event.forecast}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground/60">{isArabic ? 'السابق' : 'Previous'}</p>
                        <p className="text-xs font-semibold text-muted-foreground trading-number">{event.previous}</p>
                      </div>
                    </div>
                  </div>
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
