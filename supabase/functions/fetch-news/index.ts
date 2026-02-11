const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface RSSItem {
  id: string;
  title: string;
  summary: string;
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

    // Try multiple image sources
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
        summary: description.substring(0, 200),
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

    console.log(`Fetched ${allItems.length} news items`);

    return new Response(
      JSON.stringify({ success: true, data: allItems.slice(0, 30) }),
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
