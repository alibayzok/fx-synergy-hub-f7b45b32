# 📋 جميع أكواد Edge Functions - جاهزة للنسخ

## 🔧 تعليمات الاستخدام

1. افتح داشبورد Supabase → Edge Functions
2. أنشئ function جديدة بالاسم المحدد
3. انسخ الكود والصقه
4. **مهم:** عطّل "Verify JWT" لكل function من الإعدادات
5. أضف الـ Secrets المطلوبة من: Project Settings → Edge Functions → Secrets

---

## 📑 قائمة الأسرار المطلوبة (Secrets)

| Secret | مطلوب لـ |
|--------|---------|
| `LOVABLE_API_KEY` أو `GOOGLE_AI_API_KEY` | chat, moderate-image, fetch-news, fetch-article, fetch-calendar |
| `FINNHUB_API_KEY` | market-data |
| `FCM_SERVER_KEY` | send-push-notification |
| `MARQETA_APP_TOKEN` | marqeta-cards |
| `MARQETA_ADMIN_TOKEN` | marqeta-cards |
| `MARQETA_BASE_URL` | marqeta-cards (اختياري، الافتراضي: sandbox) |
| `TELEGRAM_BOT_TOKEN` | telegram-webhook, setup-telegram-webhook |
| `TELEGRAM_WEBHOOK_SECRET` | telegram-webhook, setup-telegram-webhook |

> ملاحظة: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` تكون متوفرة تلقائياً.

---

## 1️⃣ chat

**الوصف:** مساعد AI ذكي للتداول
**الأسرار:** `LOVABLE_API_KEY` أو `GOOGLE_AI_API_KEY`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "غير مصرح" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    // Validate messages input
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(JSON.stringify({ error: "بيانات غير صالحة" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate individual message structure
    for (const msg of messages) {
      if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
        return new Response(JSON.stringify({ error: "بنية رسالة غير صالحة" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return new Response(JSON.stringify({ error: "دور رسالة غير صالح" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (typeof msg.content !== 'string' || msg.content.length > 5000) {
        return new Response(JSON.stringify({ error: "محتوى رسالة غير صالح" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Use service role client to read settings (including secret ones like API keys)
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Read AI configuration from app_settings
    const { data: aiSettings } = await adminClient
      .from('app_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['ai_provider', 'ai_model', 'custom_ai_api_key', 'custom_ai_endpoint', 'ai_system_prompt']);

    const settingsMap: Record<string, string> = {};
    aiSettings?.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value || ''; });

    const aiProvider = settingsMap['ai_provider'] || 'lovable';
    const aiModel = settingsMap['ai_model'] || 'google/gemini-3-flash-preview';
    const customApiKey = settingsMap['custom_ai_api_key'] || '';
    const customEndpoint = settingsMap['custom_ai_endpoint'] || '';

    let apiKey: string;
    let endpoint: string;
    let modelToUse: string = aiModel;

    if (aiProvider === 'custom') {
      // Use custom API key from settings, or fallback to GOOGLE_AI_API_KEY env var
      const resolvedKey = customApiKey || Deno.env.get("GOOGLE_AI_API_KEY") || '';
      if (!resolvedKey) {
        throw new Error("لم يتم تكوين مفتاح API مخصص. أدخل المفتاح في إعدادات CMS أو أضف GOOGLE_AI_API_KEY.");
      }
      apiKey = resolvedKey;
      endpoint = customEndpoint || 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';
      // For custom providers, strip provider prefix from model name if present
      modelToUse = aiModel.includes('/') ? aiModel.split('/').pop()! : aiModel;
    } else {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) {
        throw new Error("LOVABLE_API_KEY is not configured");
      }
      apiKey = LOVABLE_API_KEY;
      endpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          { 
            role: "system", 
            content: settingsMap['ai_system_prompt'] || `أنت مساعد ذكي لمنصة تداول FX Synergy Hub. تساعد المستخدمين في الإجابة على أسئلة التداول والفوركس والعملات الرقمية. كن ودوداً ومفيداً وأجب باللغة العربية إلا إذا سألك المستخدم بالإنجليزية.`
          },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، يرجى المحاولة لاحقاً" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "يرجى إضافة رصيد لحساب Lovable AI" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "خطأ في خدمة الذكاء الاصطناعي" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "خطأ غير معروف" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 2️⃣ market-data

**الوصف:** بيانات أسعار السوق (فوركس، معادن، كريبتو)
**الأسرار:** `FINNHUB_API_KEY`

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYMBOLS: Record<string, { finnhub: string; name: string; asset_type: string }> = {
  XAUUSD: { finnhub: "OANDA:XAU_USD", name: "Gold", asset_type: "metals" },
  XAGUSD: { finnhub: "OANDA:XAG_USD", name: "Silver", asset_type: "metals" },
  EURUSD: { finnhub: "OANDA:EUR_USD", name: "Euro/Dollar", asset_type: "forex" },
  GBPUSD: { finnhub: "OANDA:GBP_USD", name: "Pound/Dollar", asset_type: "forex" },
  USDJPY: { finnhub: "OANDA:USD_JPY", name: "Dollar/Yen", asset_type: "forex" },
  USDCHF: { finnhub: "OANDA:USD_CHF", name: "Dollar/Franc", asset_type: "forex" },
  AUDUSD: { finnhub: "OANDA:AUD_USD", name: "Aussie/Dollar", asset_type: "forex" },
  NZDUSD: { finnhub: "OANDA:NZD_USD", name: "Kiwi/Dollar", asset_type: "forex" },
  BTCUSD: { finnhub: "BINANCE:BTCUSDT", name: "Bitcoin", asset_type: "crypto" },
  ETHUSD: { finnhub: "BINANCE:ETHUSDT", name: "Ethereum", asset_type: "crypto" },
};

interface MarketResult {
  symbol: string;
  name: string;
  asset_type: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  last_update: string;
}

// In-memory cache
let cachedResults: MarketResult[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    if (cachedResults.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cachedResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    const results: MarketResult[] = [];

    for (const [symbol, info] of Object.entries(SYMBOLS)) {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${info.finnhub}&token=${FINNHUB_API_KEY}`
        );
        if (!res.ok) continue;
        const d = await res.json();
        if (d.c && d.c > 0) {
          const change = d.c - (d.pc || d.c);
          results.push({
            symbol,
            name: info.name,
            asset_type: info.asset_type,
            price: d.c,
            change: Number(change.toFixed(5)),
            change_percent: d.pc ? Number(((change / d.pc) * 100).toFixed(2)) : 0,
            high: d.h || d.c,
            low: d.l || d.c,
            last_update: new Date().toISOString(),
          });
        }
      } catch { /* skip */ }
      await new Promise((r) => setTimeout(r, 100));
    }

    // Sort by predefined order
    const order = Object.keys(SYMBOLS);
    results.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol));

    if (results.length > 0) {
      cachedResults = results;
      lastFetchTime = now;
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Market data error:", msg);
    if (cachedResults.length > 0) {
      return new Response(JSON.stringify(cachedResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 3️⃣ moderate-image

**الوصف:** فحص الصور تلقائياً للمحتوى غير اللائق
**الأسرار:** `LOVABLE_API_KEY`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ModerationResult {
  isAllowed: boolean;
  isFlagged: boolean;
  reason?: string;
  confidence?: number;
  message?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageBase64, imageUrl } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Allow upload but flag for manual review
      const result: ModerationResult = {
        isAllowed: true,
        isFlagged: true,
        reason: "error",
        error: "LOVABLE_API_KEY is not configured",
        message: "حدث خطأ في فحص الصورة - ستتم مراجعتها يدوياً",
      };
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageDataUrl = imageBase64
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUrl;

    const requestBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are a content moderation AI. Analyze this image for inappropriate content.

IMPORTANT: You must respond ONLY with a valid JSON object, no other text.

Categories to detect:
- "porn": Explicit adult/sexual content
- "sexy": Suggestive or revealing content
- "violence": Graphic violence or gore
- "hate": Hate symbols or offensive imagery
- "safe": No issues detected

Response format (JSON only):
{
  "category": "safe|porn|sexy|violence|hate",
  "confidence": 0.0-1.0,
  "description": "brief description"
}`,
            },
            {
              type: "image_url",
              image_url: { url: imageDataUrl },
            },
          ],
        },
      ],
      max_tokens: 200,
      temperature: 0.1,
    };

    // Correct Lovable AI Gateway endpoint
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

      // IMPORTANT: Return 2xx so the client doesn't throw FunctionsHttpError.
      const result: ModerationResult = {
        isAllowed: true,
        isFlagged: true,
        reason: "error",
        error:
          response.status === 429
            ? "Rate limits exceeded, please try again later"
            : response.status === 402
              ? "Payment required for AI usage"
              : `AI gateway error: ${response.status}`,
        message: "حدث خطأ في فحص الصورة - ستتم مراجعتها يدوياً",
      };

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let analysis: { category: string; confidence: number; description: string };
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      analysis = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      analysis = { category: "safe", confidence: 0.5, description: "Unable to analyze" };
    }

    const inappropriateCategories = ["porn", "sexy", "violence", "hate"];
    const isInappropriate = inappropriateCategories.includes(String(analysis.category).toLowerCase());
    const highConfidence = Number(analysis.confidence) >= 0.7;

    const result: ModerationResult = {
      isAllowed: !(isInappropriate && highConfidence),
      isFlagged: isInappropriate,
      reason: isInappropriate ? String(analysis.category).toLowerCase() : undefined,
      confidence: Number(analysis.confidence),
      message: isInappropriate && highConfidence ? getModerationMessage(String(analysis.category)) : undefined,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Moderation error:", error);

    // IMPORTANT: Return 2xx so the client doesn't throw FunctionsHttpError.
    const result: ModerationResult = {
      isAllowed: true,
      isFlagged: true,
      reason: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      message: "حدث خطأ في فحص الصورة - ستتم مراجعتها يدوياً",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getModerationMessage(category: string): string {
  switch (category.toLowerCase()) {
    case "porn":
      return "🚫 تم اكتشاف محتوى إباحي - الصورة غير مسموح بها";
    case "sexy":
      return "⚠️ تم اكتشاف محتوى غير لائق - الصورة غير مسموح بها";
    case "violence":
      return "🚫 تم اكتشاف محتوى عنيف - الصورة غير مسموح بها";
    case "hate":
      return "🚫 تم اكتشاف محتوى كراهية - الصورة غير مسموح بها";
    default:
      return "🚫 تم اكتشاف محتوى مخالف";
  }
}
```

---

## 4️⃣ send-push-notification

**الوصف:** إرسال إشعارات push عبر Firebase
**الأسرار:** `FCM_SERVER_KEY`

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  type?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PushPayload = await req.json();
    const { user_id, title, body, data, type } = payload;

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: user_id, title, body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const fcmServerKey = Deno.env.get("FCM_SERVER_KEY");
    if (!fcmServerKey) {
      console.error("FCM_SERVER_KEY not configured");
      return new Response(
        JSON.stringify({ error: "FCM not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's FCM tokens
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokens, error: tokensError } = await supabase
      .from("fcm_tokens")
      .select("token")
      .eq("user_id", user_id);

    if (tokensError) {
      console.error("Error fetching tokens:", tokensError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log(`No FCM tokens found for user ${user_id}`);
      return new Response(
        JSON.stringify({ message: "No tokens found", sent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to all user tokens
    const results = await Promise.allSettled(
      tokens.map(async ({ token }) => {
        const fcmPayload = {
          to: token,
          notification: {
            title,
            body,
            icon: "/favicon.ico",
            click_action: data?.url || "/",
          },
          data: {
            ...data,
            type: type || "general",
          },
        };

        const response = await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${fcmServerKey}`,
          },
          body: JSON.stringify(fcmPayload),
        });

        const result = await response.json();

        // Remove invalid tokens
        if (result.failure && result.results) {
          for (const res of result.results) {
            if (
              res.error === "InvalidRegistration" ||
              res.error === "NotRegistered"
            ) {
              console.log(`Removing invalid token: ${token.substring(0, 10)}...`);
              await supabase
                .from("fcm_tokens")
                .delete()
                .eq("token", token);
            }
          }
        }

        return result;
      })
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    console.log(`Push sent to ${sent} devices, ${failed} failed for user ${user_id}`);

    return new Response(
      JSON.stringify({ message: "Push notifications sent", sent, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending push notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

---

## 5️⃣ fetch-news

**الوصف:** جلب أخبار الأسواق من مصادر RSS وترجمتها للعربية
**الأسرار:** `LOVABLE_API_KEY`

```typescript
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
```

---

## 6️⃣ fetch-article

**الوصف:** جلب وترجمة محتوى المقالات
**الأسرار:** `LOVABLE_API_KEY`

```typescript
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
  // Try to find article body with common selectors
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

  // Fallback: extract all paragraph text
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

async function translateContent(text: string, language: string): Promise<string> {
  if (language !== 'ar' || !text) return text;
  
  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) return text;

    const truncated = text.substring(0, 3000);
    
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

    // Translate if Arabic
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
```

---

## 7️⃣ fetch-calendar

**الوصف:** التقويم الاقتصادي مع ترجمة عربية
**الأسرار:** `LOVABLE_API_KEY`

```typescript
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
    // Get requested date from body or query params
    let requestedDate = new Date().toISOString().split('T')[0];
    try {
      const body = await req.json();
      if (body?.date) requestedDate = body.date;
    } catch {
      const url = new URL(req.url);
      if (url.searchParams.get('date')) requestedDate = url.searchParams.get('date')!;
    }

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
```

---

## 8️⃣ marqeta-cards

**الوصف:** إدارة البطاقات الافتراضية عبر Marqeta API
**الأسرار:** `MARQETA_APP_TOKEN`, `MARQETA_ADMIN_TOKEN`, `MARQETA_BASE_URL` (اختياري)

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MARQETA_APP_TOKEN = Deno.env.get('MARQETA_APP_TOKEN')!;
const MARQETA_ADMIN_TOKEN = Deno.env.get('MARQETA_ADMIN_TOKEN')!;
const MARQETA_BASE_URL = Deno.env.get('MARQETA_BASE_URL') || 'https://sandbox-api.marqeta.com/v3';

function marqetaHeaders() {
  const credentials = btoa(`${MARQETA_APP_TOKEN}:${MARQETA_ADMIN_TOKEN}`);
  return {
    'Authorization': `Basic ${credentials}`,
    'Content-Type': 'application/json',
  };
}

async function marqetaFetch(path: string, options: RequestInit = {}) {
  const url = `${MARQETA_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...marqetaHeaders(), ...(options.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Marqeta API error [${res.status}]: ${JSON.stringify(data)}`);
  }
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!MARQETA_APP_TOKEN || !MARQETA_ADMIN_TOKEN) {
      throw new Error('Marqeta API credentials not configured');
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email || `user_${userId.substring(0, 8)}@placeholder.com`;

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'create_user': {
        const emailToUse = params.email || userEmail;

        // Try to find existing user by email first
        const existing = await marqetaFetch(`/users?email=${encodeURIComponent(emailToUse)}&count=1`, { method: 'GET' });
        const existingUser = existing?.data?.[0];

        if (existingUser?.token) {
          result = { user_token: existingUser.token };
          break;
        }

        // Create a Marqeta user
        const marqetaUser = await marqetaFetch('/users', {
          method: 'POST',
          body: JSON.stringify({
            first_name: params.first_name || 'User',
            last_name: params.last_name || userId.substring(0, 8),
            email: emailToUse,
            active: true,
          }),
        });
        result = { user_token: marqetaUser.token };
        break;
      }

      case 'create_card': {
        // Get or create marqeta user
        let marqetaUserToken = params.marqeta_user_token;

        // Try to reuse existing token from our database
        if (!marqetaUserToken) {
          const { data: existingCards } = await supabase
            .from('virtual_cards')
            .select('marqeta_user_token')
            .eq('user_id', userId)
            .not('marqeta_user_token', 'is', null)
            .order('created_at', { ascending: false })
            .limit(1);

          const existingToken = existingCards?.[0]?.marqeta_user_token as string | undefined;
          if (existingToken) marqetaUserToken = existingToken;
        }

        if (!marqetaUserToken) {
          const emailToUse = params.email || userEmail;

          // Find existing Marqeta user by email (avoids duplicate-email error)
          const existing = await marqetaFetch(`/users?email=${encodeURIComponent(emailToUse)}&count=1`, { method: 'GET' });
          const existingUser = existing?.data?.[0];

          if (existingUser?.token) {
            marqetaUserToken = existingUser.token;
          } else {
            // Create user in Marqeta
            const marqetaUser = await marqetaFetch('/users', {
              method: 'POST',
              body: JSON.stringify({
                first_name: params.first_name || 'User',
                last_name: params.last_name || '',
                email: emailToUse,
                active: true,
              }),
            });
            marqetaUserToken = marqetaUser.token;
          }
        }

        // Get or create card product token
        let cardProductToken = params.card_product_token;
        if (!cardProductToken) {
          // Try to list existing card products
          const products = await marqetaFetch('/cardproducts?count=10', { method: 'GET' });
          if (products.data && products.data.length > 0) {
            cardProductToken = products.data[0].token;
          } else {
            // Create a default card product
            const newProduct = await marqetaFetch('/cardproducts', {
              method: 'POST',
              body: JSON.stringify({
                name: 'Virtual Card',
                start_date: new Date().toISOString().split('T')[0],
                config: {
                  fulfillment: { payment_instrument: 'VIRTUAL_PAN' },
                  poi: { ecommerce: true },
                  card_life_cycle: { activate_upon_issue: true },
                },
              }),
            });
            cardProductToken = newProduct.token;
          }
        }

        // Create virtual card
        const card = await marqetaFetch('/cards', {
          method: 'POST',
          body: JSON.stringify({
            user_token: marqetaUserToken,
            card_product_token: cardProductToken,
          }),
        });

        // Save to database
        const { data: cardData, error: dbError } = await supabase
          .from('virtual_cards')
          .insert({
            user_id: userId,
            marqeta_card_token: card.token,
            marqeta_user_token: marqetaUserToken,
            card_last_four: card.last_four,
            card_status: 'active',
            nickname: params.nickname || 'بطاقتي الافتراضية',
            spending_limit: params.spending_limit || 1000,
          })
          .select()
          .single();

        if (dbError) throw dbError;
        result = { card: cardData, marqeta_card: card };
        break;
      }

      case 'list_cards': {
        const { data: cards, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        result = { cards };
        break;
      }

      case 'get_card_details': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        let marqetaDetails = null;
        if (card.marqeta_card_token) {
          try {
            marqetaDetails = await marqetaFetch(`/cards/${card.marqeta_card_token}/showpan?show_cvv_number=true`);
          } catch (e) {
            console.error('Failed to get Marqeta card details:', e);
          }
        }

        result = { card, marqeta_details: marqetaDetails };
        break;
      }

      case 'freeze_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        if (card.marqeta_card_token) {
          await marqetaFetch(`/cards/${card.marqeta_card_token}/transitions`, {
            method: 'POST',
            body: JSON.stringify({
              card_token: card.marqeta_card_token,
              channel: 'API',
              state: 'SUSPENDED',
              reason_code: '01',
            }),
          });
        }

        await supabase
          .from('virtual_cards')
          .update({ card_status: 'frozen' })
          .eq('id', params.card_id);

        result = { success: true, status: 'frozen' };
        break;
      }

      case 'unfreeze_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        if (card.marqeta_card_token) {
          await marqetaFetch(`/cards/${card.marqeta_card_token}/transitions`, {
            method: 'POST',
            body: JSON.stringify({
              card_token: card.marqeta_card_token,
              channel: 'API',
              state: 'ACTIVE',
              reason_code: '01',
            }),
          });
        }

        await supabase
          .from('virtual_cards')
          .update({ card_status: 'active' })
          .eq('id', params.card_id);

        result = { success: true, status: 'active' };
        break;
      }

      case 'cancel_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        if (card.marqeta_card_token) {
          await marqetaFetch(`/cards/${card.marqeta_card_token}/transitions`, {
            method: 'POST',
            body: JSON.stringify({
              card_token: card.marqeta_card_token,
              channel: 'API',
              state: 'TERMINATED',
              reason_code: '01',
            }),
          });
        }

        await supabase
          .from('virtual_cards')
          .update({ card_status: 'cancelled' })
          .eq('id', params.card_id);

        result = { success: true, status: 'cancelled' };
        break;
      }

      case 'get_transactions': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        let transactions = [];
        if (card.marqeta_user_token) {
          try {
            const txData = await marqetaFetch(`/transactions?user_token=${card.marqeta_user_token}&count=20`);
            transactions = txData.data || [];
          } catch (e) {
            console.error('Failed to get transactions:', e);
          }
        }

        result = { transactions };
        break;
      }

      case 'fund_card': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .single();
        if (error) throw error;

        if (!card.marqeta_user_token) {
          throw new Error('Card has no Marqeta user token');
        }

        // Create GPA Order to fund the card
        const gpaOrder = await marqetaFetch('/gpaorders', {
          method: 'POST',
          body: JSON.stringify({
            user_token: card.marqeta_user_token,
            amount: params.amount,
            currency_code: card.currency || 'USD',
            funding_source_token: params.funding_source_token || undefined,
            memo: params.memo || `Card funding - ${params.amount} USD via USDT`,
          }),
        });

        result = { success: true, gpa_order: gpaOrder };
        break;
      }

      case 'get_balance': {
        const { data: card, error } = await supabase
          .from('virtual_cards')
          .select('*')
          .eq('id', params.card_id)
          .eq('user_id', userId)
          .single();
        if (error) throw error;

        let balance = null;
        if (card.marqeta_user_token) {
          try {
            balance = await marqetaFetch(`/balances/${card.marqeta_user_token}`);
          } catch (e) {
            console.error('Failed to get balance:', e);
          }
        }

        result = { balance };
        break;
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Marqeta cards error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
```

---

## 9️⃣ telegram-webhook

**الوصف:** استقبال رسائل تلغرام وحفظها كتحديثات إشارات
**الأسرار:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`

> ⚠️ هذا الملف يحتاج لكتابة الكود الكامل. الملف الحالي فارغ تقريباً. يجب كتابة الكود حسب احتياجات البوت.

```typescript
// TODO: أضف كود webhook الخاص ببوت تلغرام هنا
// الكود يجب أن يستقبل رسائل من قناة تلغرام ويحفظها في جدول signal_updates
// يحتاج: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
```

---

## 🔟 setup-telegram-webhook

**الوصف:** تسجيل webhook تلغرام مع Telegram API
**الأسرار:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`

```typescript
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    if (!botToken || !webhookSecret || !supabaseUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required secrets" }),
        { status: 500, headers: corsHeaders }
      );
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/telegram-webhook`;

    // Register webhook with Telegram
    const res = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: webhookSecret,
          allowed_updates: ["channel_post"],
        }),
      }
    );

    const result = await res.json();
    console.log("Telegram setWebhook result:", JSON.stringify(result));

    return new Response(
      JSON.stringify({
        success: result.ok,
        webhook_url: webhookUrl,
        telegram_response: result,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Setup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
```

---

## ⚙️ إعدادات config.toml

عطّل "Verify JWT" لكل function في الداشبورد، أو استخدم هذا التكوين:

```toml
[functions.chat]
verify_jwt = false

[functions.moderate-image]
verify_jwt = false

[functions.market-data]
verify_jwt = false

[functions.fetch-news]
verify_jwt = false

[functions.fetch-article]
verify_jwt = false

[functions.fetch-calendar]
verify_jwt = false

[functions.marqeta-cards]
verify_jwt = false

[functions.send-push-notification]
verify_jwt = false

[functions.telegram-webhook]
verify_jwt = false

[functions.setup-telegram-webhook]
verify_jwt = false
```
