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

/**
 * نظام المزود الموحد — يقرأ من CMS أولاً ثم يستخدم env vars كاحتياطي
 * moderate-image يستخدم gemini-3-flash-preview لأنه يحتاج vision
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
          model: 'gemini-3-flash-preview',
        };
      }
    }

    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (googleKey) {
      return {
        apiKey: googleKey,
        endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemini-3-flash-preview",
      };
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) {
      return {
        apiKey: lovableKey,
        endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
        model: "google/gemini-3-flash-preview",
      };
    }
  } catch (err) {
    console.error('Error reading CMS AI settings:', err);
    const googleKey = Deno.env.get("GOOGLE_AI_API_KEY");
    if (googleKey) {
      return {
        apiKey: googleKey,
        endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: "gemini-3-flash-preview",
      };
    }
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (lovableKey) {
      return {
        apiKey: lovableKey,
        endpoint: "https://ai.gateway.lovable.dev/v1/chat/completions",
        model: "google/gemini-3-flash-preview",
      };
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

 const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });


    const { imageBase64, imageUrl } = await req.json();

    if (!imageBase64 && !imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ai = await getAIConfig();
    if (!ai) {
      const result: ModerationResult = {
        isAllowed: true,
        isFlagged: true,
        reason: "error",
        error: "No AI API key configured",
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
      model: ai.model,
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

    const response = await fetch(ai.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ai.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);

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
