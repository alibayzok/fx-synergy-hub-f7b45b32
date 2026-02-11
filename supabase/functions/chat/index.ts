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
      .in('setting_key', ['ai_provider', 'ai_model', 'custom_ai_api_key', 'custom_ai_endpoint']);

    const settingsMap: Record<string, string> = {};
    aiSettings?.forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value || ''; });

    const aiProvider = settingsMap['ai_provider'] || 'lovable';
    const aiModel = settingsMap['ai_model'] || 'google/gemini-3-flash-preview';
    const customApiKey = settingsMap['custom_ai_api_key'] || '';
    const customEndpoint = settingsMap['custom_ai_endpoint'] || '';

    let apiKey: string;
    let endpoint: string;
    let modelToUse: string = aiModel;

    if (aiProvider === 'custom' && customApiKey) {
      apiKey = customApiKey;
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
            content: `أنت مساعد ذكي لمنصة تداول FX Synergy Hub. تساعد المستخدمين في:
- الإجابة على أسئلة التداول والفوركس والعملات الرقمية
- شرح المصطلحات المالية والتحليل الفني
- تقديم نصائح عامة حول إدارة المخاطر
- المساعدة في استخدام المنصة

تذكر:
- لا تقدم نصائح استثمارية محددة
- شجع المستخدمين على البحث والتعلم
- كن ودوداً ومفيداً
- أجب باللغة العربية إلا إذا سألك المستخدم بالإنجليزية`
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
