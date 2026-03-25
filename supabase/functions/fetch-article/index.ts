import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]*>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function extractArticleContent(html: string): string {
  const patterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*article[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*article[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*post[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*entry[_-]?content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*content[_-]?body[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="article[_-]?content"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const content = stripHtml(match[1]);
      if (content.length > 100) return content;
    }
  }

  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let m;
  while ((m = pRegex.exec(html)) !== null) {
    const text = stripHtml(m[1]).trim();
    if (text.length > 30) paragraphs.push(text);
  }
  
  if (paragraphs.length > 0) {
    return paragraphs.join('\n\n');
  }

  return '';
}

/**
 * نظام المزود الموحد — يقرأ من CMS أولاً ثم يستخدم env vars كاحتياطي
 */
async function getAIConfig(): Promise<{ apiKey: string; endpoint: string; model: string } | null> {
  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: aiSettings } = await adminClient
      .from('app_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['ai_provider', 'custom_ai_api_key', 'custom_ai_endpoint']);

    const settings: Record<string, string> = {};
    aiSettings?.forEach((s: any) => { settings[s.setting_key] = s.setting_value || ''; });

    const provider = settings['ai_provider'] || 'lovable';
    const customKey = settings['custom_ai_api_key'] || '';
    const customEndpoint = settings['custom_ai_endpoint'] || '';

    if (provider === 'custom') {
      const key = customKey || Deno.env.get('GOOGLE_AI_API_KEY') || '';
      if (key) {
        return {
          apiKey: key,
          endpoint: customEndpoint || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          model: 'gemini-2.5-flash-lite',
        };
      }
    }

    const googleKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (googleKey) {
      return {
        apiKey: googleKey,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        model: 'gemini-2.5-flash-lite',
      };
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (lovableKey) {
      return {
        apiKey: lovableKey,
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
        model: 'google/gemini-2.5-flash-lite',
      };
    }
  } catch (err) {
    console.error('Error reading CMS AI settings:', err);
    const googleKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (googleKey) {
      return {
        apiKey: googleKey,
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
        model: 'gemini-2.5-flash-lite',
      };
    }
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (lovableKey) {
      return {
        apiKey: lovableKey,
        endpoint: 'https://ai.gateway.lovable.dev/v1/chat/completions',
        model: 'google/gemini-2.5-flash-lite',
      };
    }
  }

  return null;
}

async function translateContent(text: string, language: string): Promise<string> {
  if (language !== 'ar' || !text) return text;
  
  try {
    const ai = await getAIConfig();
    if (!ai) return text;

    const truncated = text.substring(0, 3000);
    
    const response = await fetch(ai.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ai.apiKey}`,
      },
      body: JSON.stringify({
        model: ai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional financial news translator. Translate from English to Arabic. Keep financial terms, currency pairs, company names, and numbers in their original form. Return ONLY the translated text, nothing else.'
          },
          { role: 'user', content: `Translate this financial article to Arabic:\n\n${truncated}` }
        ]
      })
    });

    if (!response.ok) return text;
    const data = await response.json();
    return data.choices?.[0]?.message?.content || text;
  } catch {
    return text;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, language } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    let content = extractArticleContent(html);

    if (!content || content.length < 50) {
      content = '';
    }

    const translatedContent = await translateContent(content, language || 'en');

    return new Response(
      JSON.stringify({ success: true, content: translatedContent, content_en: content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-article:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
