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
