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
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Prepare the image data URL for the API
    const imageDataUrl = imageBase64 
      ? `data:image/jpeg;base64,${imageBase64}`
      : imageUrl;

    const requestBody = {
      model: "google/gemini-2.5-flash",
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
}`
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl
              }
            }
          ]
        }
      ],
      max_tokens: 200,
      temperature: 0.1
    };

    // Call Lovable AI API (OpenAI-compatible)
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`Lovable AI API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from OpenAI-compatible response
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the AI response
    let analysis: { category: string; confidence: number; description: string };
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Default to safe if parsing fails
      analysis = { category: "safe", confidence: 0.5, description: "Unable to analyze" };
    }

    // Determine if content is allowed
    const inappropriateCategories = ["porn", "sexy", "violence", "hate"];
    const isInappropriate = inappropriateCategories.includes(analysis.category.toLowerCase());
    const highConfidence = analysis.confidence >= 0.7;

    const result: ModerationResult = {
      isAllowed: !(isInappropriate && highConfidence),
      isFlagged: isInappropriate,
      reason: isInappropriate ? analysis.category : undefined,
      confidence: analysis.confidence,
      message: isInappropriate && highConfidence 
        ? getModerationMessage(analysis.category) 
        : undefined,
    };

    console.log("Moderation result:", { category: analysis.category, confidence: analysis.confidence, isAllowed: result.isAllowed });

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Moderation error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        // On error, allow but flag for manual review
        isAllowed: true,
        isFlagged: true,
        reason: "error",
        message: "حدث خطأ في فحص الصورة - ستتم مراجعتها يدوياً"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
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
