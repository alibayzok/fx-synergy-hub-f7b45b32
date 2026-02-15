import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-telegram-bot-api-secret-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the secret token from Telegram
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");

    if (!webhookSecret || secretToken !== webhookSecret) {
      console.error("Invalid secret token");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const update = await req.json();
    console.log("Received Telegram update:", JSON.stringify(update));

    // We only care about channel posts
    const post = update.channel_post;
    if (!post) {
      console.log("Not a channel_post, ignoring");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Verify this is from VIP channel
    const vipChatId = Deno.env.get("TELEGRAM_VIP_CHAT_ID");
    const chatId = String(post.chat?.id);

    if (chatId !== vipChatId) {
      console.log(`Message from unknown chat ${chatId}, expected ${vipChatId}`);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Extract text content
    const rawText = post.text || post.caption || "";
    if (!rawText.trim()) {
      console.log("Empty message, ignoring");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Split into title (first line) and content (rest)
    const lines = rawText.trim().split("\n");
    const title = lines[0].substring(0, 200); // limit title length
    const content = lines.length > 1 ? lines.slice(1).join("\n").trim() : rawText.trim();

    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const attachments: string[] = [];

    // Handle photos
    if (post.photo && post.photo.length > 0) {
      try {
        // Get the largest photo (last in array)
        const photo = post.photo[post.photo.length - 1];
        const fileId = photo.file_id;

        // Get file path from Telegram
        const fileRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
        );
        const fileData = await fileRes.json();

        if (fileData.ok && fileData.result?.file_path) {
          // Download the file
          const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
          const imageRes = await fetch(downloadUrl);
          const imageBlob = await imageRes.blob();

          // Generate unique filename
          const ext = fileData.result.file_path.split(".").pop() || "jpg";
          const fileName = `telegram_${Date.now()}_${crypto.randomUUID().substring(0, 8)}.${ext}`;

          // Upload to storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from("signal-attachments")
            .upload(fileName, imageBlob, {
              contentType: imageBlob.type || "image/jpeg",
              upsert: false,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
          } else {
            // Get public URL
            const { data: urlData } = supabase.storage
              .from("signal-attachments")
              .getPublicUrl(fileName);
            
            if (urlData?.publicUrl) {
              attachments.push(urlData.publicUrl);
              console.log("Image uploaded:", urlData.publicUrl);
            }
          }
        }
      } catch (imgErr) {
        console.error("Error processing image:", imgErr);
      }
    }

    // Insert into signals table
    const { data, error } = await supabase.from("signals").insert({
      title,
      content,
      visibility: "vip",
      attachments: attachments.length > 0 ? attachments : null,
      created_by: null, // From bot, not a registered user
    });

    if (error) {
      console.error("Insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    console.log("Signal created successfully from Telegram");
    return new Response(JSON.stringify({ ok: true, message: "Signal created" }), {
      headers: corsHeaders,
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
