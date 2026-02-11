const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RSSItem {
  id: string;
  title: string;
  title_ar: string;
  summary: string;
  summary_ar: string;
  link: string;
  source: string;
  category: string;
  pubDate: string;
  imageUrl: string;
}

function extractImageFromContent(content: string): string {
  const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
  if (imgMatch) return imgMatch[1];
  const mediaMatch = content.match(/<media:content[^>]+url=["']([^"']+)["']/);
  if (mediaMatch) return mediaMatch[1];
  return '';
}

function extractCDATA(text: string): string {
  const cdataMatch = text.match(/<!\[CDATA\[([\s\S]*?)\]\]>/);
  return cdataMatch ? cdataMatch[1].trim() : text.trim();
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim();
}

function getTagContent(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? extractCDATA(match[1]) : '';
}

function parseRSSItems(xml: string, source: string, category: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 10) {
    const itemXml = match[1];
    const title = stripHtml(getTagContent(itemXml, 'title'));
    const description = stripHtml(getTagContent(itemXml, 'description'));
    const link = getTagContent(itemXml, 'link');
    const pubDate = getTagContent(itemXml, 'pubDate');

    let imageUrl = '';
    const enclosureMatch = itemXml.match(/<enclosure[^>]+url=["']([^"']+)["']/);
    if (enclosureMatch) imageUrl = enclosureMatch[1];
    if (!imageUrl) {
      const mediaThumbnail = itemXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/);
      if (mediaThumbnail) imageUrl = mediaThumbnail[1];
    }
    if (!imageUrl) {
      const mediaContent = itemXml.match(/<media:content[^>]+url=["']([^"']+)["']/);
      if (mediaContent) imageUrl = mediaContent[1];
    }
    if (!imageUrl) imageUrl = extractImageFromContent(itemXml);

    if (title) {
      items.push({
        id: `${source}-${items.length}-${Date.now()}`,
        title,
        title_ar: '',
        summary: description.substring(0, 300),
        summary_ar: '',
        link,
        source,
        category,
        pubDate,
        imageUrl,
      });
    }
  }

  return items;
}

const RSS_FEEDS = [
  { url: 'https://www.forexlive.com/feed/news', source: 'ForexLive', category: 'forex' },
  { url: 'https://www.fxstreet.com/rss/news', source: 'FXStreet', category: 'forex' },
  { url: 'https://cointelegraph.com/rss', source: 'CoinTelegraph', category: 'crypto' },
  { url: 'https://www.investing.com/rss/news.rss', source: 'Investing.com', category: 'economy' },
  { url: 'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US', source: 'Yahoo Finance', category: 'stocks' },
];

async function translateToArabic(items: RSSItem[]): Promise<RSSItem[]> {
  try {
    const textsToTranslate = items.map(item => `TITLE: ${item.title}\nSUMMARY: ${item.summary}`).join('\n---\n');
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return items;
    }
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial news translator. Translate the following financial news titles and summaries from English to Arabic. Keep financial terms, currency pairs, and numbers in their original form. Return ONLY a JSON array where each element has "title_ar" and "summary_ar" fields. No markdown, no code blocks, just pure JSON.'
          },
          {
            role: 'user',
            content: `Translate these ${items.length} news items to Arabic. Return a JSON array with ${items.length} objects, each having "title_ar" and "summary_ar":\n\n${textsToTranslate}`
          }
        ]
      })
    });

    if (!response.ok) {
      console.error('Translation API error:', response.status);
      return items;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response
    let jsonStr = content.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) jsonStr = jsonMatch[0];
    
    const translations = JSON.parse(jsonStr);
    
    if (Array.isArray(translations) && translations.length === items.length) {
      return items.map((item, i) => ({
        ...item,
        title_ar: translations[i]?.title_ar || item.title,
        summary_ar: translations[i]?.summary_ar || item.summary,
      }));
    }
    
    return items;
  } catch (err) {
    console.error('Translation error:', err);
    return items;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category } = await req.json().catch(() => ({ category: 'all' }));

    const feedsToFetch = category === 'all'
      ? RSS_FEEDS
      : RSS_FEEDS.filter(f => f.category === category);

    const results = await Promise.allSettled(
      feedsToFetch.map(async (feed) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 8000);

          const response = await fetch(feed.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; AssassinFX/1.0)',
              'Accept': 'application/rss+xml, application/xml, text/xml, */*',
            },
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!response.ok) {
            console.error(`Feed ${feed.source} returned ${response.status}`);
            return [];
          }

          const xml = await response.text();
          return parseRSSItems(xml, feed.source, feed.category);
        } catch (err) {
          console.error(`Error fetching ${feed.source}:`, err.message);
          return [];
        }
      })
    );

    const allItems: RSSItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        allItems.push(...result.value);
      }
    }

    // Sort by date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.pubDate).getTime() || 0;
      const dateB = new Date(b.pubDate).getTime() || 0;
      return dateB - dateA;
    });

    const topItems = allItems.slice(0, 30);

    // Translate to Arabic
    const translatedItems = await translateToArabic(topItems);

    console.log(`Fetched ${translatedItems.length} news items with translations`);

    return new Response(
      JSON.stringify({ success: true, data: translatedItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-news:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
