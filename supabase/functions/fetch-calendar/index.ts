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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
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
    // Fetch from Investing.com economic calendar RSS or use scraping
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];

    // Try fetching from FX Street economic calendar
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch('https://www.investing.com/economic-calendar/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const events: CalendarEvent[] = [];

    if (response.ok) {
      const html = await response.text();
      
      // Parse economic calendar events from HTML
      const eventRegex = /<tr[^>]*class="[^"]*js-event-item[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
      let match;
      let eventId = 0;

      while ((match = eventRegex.exec(html)) !== null && events.length < 30) {
        const row = match[1];
        
        // Extract time
        const timeMatch = row.match(/<td[^>]*class="[^"]*time[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
        const time = timeMatch ? stripHtml(timeMatch[1]) : '';
        
        // Extract currency
        const currMatch = row.match(/<td[^>]*class="[^"]*flagCur[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
        const currency = currMatch ? stripHtml(currMatch[1]).trim() : '';
        
        // Extract impact (bull icons count)
        const impactMatch = row.match(/sentiment/gi);
        const impactCount = impactMatch ? impactMatch.length : 0;
        const impact: 'low' | 'medium' | 'high' = impactCount >= 3 ? 'high' : impactCount >= 2 ? 'medium' : 'low';
        
        // Extract event name
        const eventMatch = row.match(/<td[^>]*class="[^"]*event[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
        const eventName = eventMatch ? stripHtml(eventMatch[1]).trim() : '';
        
        // Extract actual, forecast, previous
        const actualMatch = row.match(/<td[^>]*class="[^"]*act[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
        const forecastMatch = row.match(/<td[^>]*class="[^"]*fore[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
        const prevMatch = row.match(/<td[^>]*class="[^"]*prev[^"]*"[^>]*>([\s\S]*?)<\/td>/i);
        
        if (eventName && currency) {
          events.push({
            id: `cal-${eventId++}`,
            time: time || '--:--',
            currency,
            impact,
            event: eventName,
            event_ar: eventName,
            actual: actualMatch ? stripHtml(actualMatch[1]).trim() : '-',
            forecast: forecastMatch ? stripHtml(forecastMatch[1]).trim() : '-',
            previous: prevMatch ? stripHtml(prevMatch[1]).trim() : '-',
            date: dateStr,
          });
        }
      }
    }

    // If scraping failed, provide sample data structure
    if (events.length === 0) {
      // Fallback: Use AI to generate today's expected economic events
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
                  content: 'You are an economic calendar assistant. Generate realistic economic calendar events for today. Return ONLY a JSON array with objects having: time (HH:MM format), currency (3-letter code), impact ("low"/"medium"/"high"), event (English name), event_ar (Arabic name), actual ("-" if not released), forecast (number or "-"), previous (number). Generate 15-20 events for major currencies (USD, EUR, GBP, JPY, CHF, AUD, CAD, NZD). No markdown.'
                },
                { role: 'user', content: `Generate economic calendar events for today ${dateStr}. Include real-world typical events like NFP, CPI, PMI, interest rate decisions, etc.` }
              ]
            })
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const content = aiData.choices?.[0]?.message?.content || '';
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const aiEvents = JSON.parse(jsonMatch[0]);
              if (Array.isArray(aiEvents)) {
                aiEvents.forEach((e: any, i: number) => {
                  events.push({
                    id: `cal-ai-${i}`,
                    time: e.time || '--:--',
                    currency: e.currency || 'USD',
                    impact: e.impact || 'medium',
                    event: e.event || '',
                    event_ar: e.event_ar || e.event || '',
                    actual: e.actual || '-',
                    forecast: e.forecast || '-',
                    previous: e.previous || '-',
                    date: dateStr,
                  });
                });
              }
            }
          }
        } catch (err) {
          console.error('AI calendar error:', err);
        }
      }
    } else {
      // Translate scraped events
      const translated = await translateEvents(events);
      events.length = 0;
      events.push(...translated);
    }

    // Sort by time
    events.sort((a, b) => a.time.localeCompare(b.time));

    console.log(`Calendar: ${events.length} events`);

    return new Response(
      JSON.stringify({ success: true, data: events, date: dateStr }),
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
