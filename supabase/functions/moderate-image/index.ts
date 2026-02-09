import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
