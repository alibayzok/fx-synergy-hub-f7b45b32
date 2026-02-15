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

    const post = update.channel_post;
    if (!post) {
      console.log("Not a channel_post, ignoring");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    const chatId = String(post.chat?.id);
    const vipChatId = Deno.env.get("TELEGRAM_VIP_CHAT_ID");
    const publicChatId = Deno.env.get("TELEGRAM_PUBLIC_CHAT_ID");
    const newsChatId = Deno.env.get("TELEGRAM_NEWS_CHAT_ID");

    // Determine channel type
    let channelType: "vip" | "public" | "news" | null = null;
    if (chatId === vipChatId) channelType = "vip";
    else if (chatId === publicChatId) channelType = "public";
    else if (chatId === newsChatId) channelType = "news";

    if (!channelType) {
      console.log(`Message from unknown chat ${chatId}`);
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Extract text content
    const rawText = post.text || post.caption || "";
    if (!rawText.trim()) {
      console.log("Empty message, ignoring");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Check for publish hashtag (#نشر or #publish)
    const hasPublishTag = /#نشر|#publish/i.test(rawText);
    if (!hasPublishTag) {
      console.log("No publish hashtag found, ignoring");
      return new Response(JSON.stringify({ ok: true, message: "No publish tag" }), { headers: corsHeaders });
    }

    // Remove the hashtag from the text
    const cleanText = rawText.replace(/#نشر|#publish/gi, "").trim();
    if (!cleanText) {
      console.log("Empty after removing hashtag, ignoring");
      return new Response(JSON.stringify({ ok: true }), { headers: corsHeaders });
    }

    // Initialize Supabase with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const attachments: string[] = [];

    // Handle photos
    if (post.photo && post.photo.length > 0) {
      try {
        const photo = post.photo[post.photo.length - 1];
        const fileId = photo.file_id;

        const fileRes = await fetch(
          `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`
        );
        const fileData = await fileRes.json();

        if (fileData.ok && fileData.result?.file_path) {
          const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
          const imageRes = await fetch(downloadUrl);
          const imageBlob = await imageRes.blob();

          const ext = fileData.result.file_path.split(".").pop() || "jpg";
          const fileName = `telegram_${Date.now()}_${crypto.randomUUID().substring(0, 8)}.${ext}`;

          // Choose bucket based on channel type
          const bucket = channelType === "news" ? "article-images" : "signal-attachments";

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, imageBlob, {
              contentType: imageBlob.type || "image/jpeg",
              upsert: false,
            });

          if (uploadError) {
            console.error("Upload error:", uploadError);
          } else {
            const { data: urlData } = supabase.storage
              .from(bucket)
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

    // Split into title (first line) and content (rest)
    const lines = cleanText.split("\n").filter(l => l.trim());
    const title = lines[0].substring(0, 200);
    const content = lines.length > 1 ? lines.slice(1).join("\n").trim() : cleanText;

    let result;

    if (channelType === "news") {
      // Insert into articles table
      const { data, error } = await supabase.from("articles").insert({
        title_ar: title,
        title_en: "",
        content_ar: content,
        content_en: "",
        summary_ar: content.substring(0, 200),
        summary_en: "",
        image_url: attachments.length > 0 ? attachments[0] : null,
        is_published: true,
        category: "general",
        created_by: "telegram-bot",
      });
      result = { data, error };
      if (!error) console.log("Article created from Telegram news channel");
    } else {
      // Insert into signals table (vip or public/free)
      const visibility = channelType === "vip" ? "vip" : "free";
      const { data, error } = await supabase.from("signals").insert({
        title,
        content,
        visibility,
        attachments: attachments.length > 0 ? attachments : null,
        created_by: null,
      });
      result = { data, error };
      if (!error) console.log(`Signal created (${visibility}) from Telegram`);
    }

    if (result.error) {
      console.error("Insert error:", result.error);
      return new Response(JSON.stringify({ error: result.error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ ok: true, channel: channelType }), {
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
