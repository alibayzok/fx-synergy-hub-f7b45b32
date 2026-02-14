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
