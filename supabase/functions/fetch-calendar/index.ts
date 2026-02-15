const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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

interface FFEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
  actual?: string;
}

function getImpact(impact: string): 'low' | 'medium' | 'high' {
  switch (impact?.toLowerCase()) {
    case 'high':
    case 'holiday':
      return 'high';
    case 'medium':
      return 'medium';
    default:
      return 'low';
  }
}

async function translateEvents(events: CalendarEvent[]): Promise<CalendarEvent[]> {
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY || events.length === 0) return events;

    const eventNames = events.map(e => e.event).join('\n');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'Translate the following economic event names from English to Arabic. Return ONLY a JSON array of translated strings in the same order. Keep currency names and numbers as-is. No markdown, just pure JSON array.'
          },
          { role: 'user', content: `Translate these ${events.length} event names:\n${eventNames}` }
        ]
      })
    });

    if (!response.ok) return events;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return events;
    
    const translations = JSON.parse(jsonMatch[0]);
    if (Array.isArray(translations) && translations.length === events.length) {
      return events.map((e, i) => ({ ...e, event_ar: translations[i] || e.event }));
    }
    return events;
  } catch {
    return events;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get requested date from query params
    const url = new URL(req.url);
    const requestedDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];

    // Fetch real data from Forex Factory JSON feed
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://nfs.faireconomy.media/ff_calendar_thisweek.json', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const events: CalendarEvent[] = [];

    if (response.ok) {
      const ffEvents: FFEvent[] = await response.json();
      
      // Filter events for the requested date
      let eventId = 0;
      for (const ev of ffEvents) {
        // FF date format: "2026-02-15T13:30:00-05:00" or similar
        const eventDate = ev.date ? ev.date.split('T')[0] : '';
        
        if (eventDate !== requestedDate) continue;

        // Extract time from date string
        let time = '--:--';
        try {
          const d = new Date(ev.date);
          const hours = d.getUTCHours().toString().padStart(2, '0');
          const minutes = d.getUTCMinutes().toString().padStart(2, '0');
          time = `${hours}:${minutes}`;
        } catch { /* keep default */ }

        events.push({
          id: `cal-${eventId++}`,
          time,
          currency: ev.country || '',
          impact: getImpact(ev.impact),
          event: ev.title || '',
          event_ar: ev.title || '',
          actual: ev.actual || '-',
          forecast: ev.forecast || '-',
          previous: ev.previous || '-',
          date: requestedDate,
        });
      }
    }

    // If no events found for the requested date (could be outside this week's range),
    // return empty array - do NOT generate fake data
    if (events.length > 0) {
      // Translate event names to Arabic
      const translated = await translateEvents(events);
      events.length = 0;
      events.push(...translated);
    }

    // Sort by time
    events.sort((a, b) => a.time.localeCompare(b.time));

    console.log(`Calendar: ${events.length} events for ${requestedDate}`);

    return new Response(
      JSON.stringify({ success: true, data: events, date: requestedDate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-calendar:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
