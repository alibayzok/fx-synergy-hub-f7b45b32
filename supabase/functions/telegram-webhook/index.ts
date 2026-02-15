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

    // Check for publish hashtag (#نشر or #publish) or update hashtag (#تحديث or #update)
    const hasPublishTag = /#نشر|#publish/i.test(rawText);
    const hasUpdateTag = /#تحديث|#update/i.test(rawText);
    const isReply = !!post.reply_to_message;

    if (!hasPublishTag && !hasUpdateTag && !isReply) {
      console.log("No publish/update hashtag and not a reply, ignoring");
      return new Response(JSON.stringify({ ok: true, message: "No action tag" }), { headers: corsHeaders });
    }

    // Extract category from hashtags (for news/articles channel)
    // Supported: #تعليم/#education, #عام/#general, #تحليل/#analysis, #اخبار/#news
    const categoryMap: Record<string, string> = {
      "#تعليم": "education", "#education": "education",
      "#عام": "general", "#general": "general",
      "#تحليل": "analysis", "#analysis": "analysis",
      "#اخبار": "news", "#news": "news",
    };
    let detectedCategory = "general";
    for (const [tag, cat] of Object.entries(categoryMap)) {
      if (rawText.toLowerCase().includes(tag.toLowerCase())) {
        detectedCategory = cat;
        break;
      }
    }

    // Remove all known hashtags from the text
    const cleanText = rawText
      .replace(/#نشر|#publish|#تحديث|#update/gi, "")
      .replace(/#تعليم|#education|#عام|#general|#تحليل|#analysis|#اخبار|#news/gi, "")
      .trim();
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

    // Split into title (first line) and content (rest), preserving formatting
    const lines = cleanText.split("\n");
    const firstNonEmptyIndex = lines.findIndex(l => l.trim());
    const title = (firstNonEmptyIndex >= 0 ? lines[firstNonEmptyIndex] : lines[0]).substring(0, 200);
    const contentLines = firstNonEmptyIndex >= 0 ? lines.slice(firstNonEmptyIndex + 1) : lines;
    
    // For articles: convert newlines to HTML <br> and paragraphs for proper display
    let content: string;
    if (channelType === "news") {
      // Convert double newlines to paragraphs, single newlines to <br>
      content = contentLines.join("\n").trim()
        .split(/\n\s*\n/)
        .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("\n");
    } else {
      content = contentLines.join("\n").trim() || cleanText;
    }

    let result;

    // Check if this is a reply/update to an existing signal
    const isUpdate = isReply || hasUpdateTag;

    if (isUpdate && isReply && channelType !== "news") {
      // This is a reply to an existing message - find the parent signal by telegram_message_id
      const replyToMsgId = post.reply_to_message?.message_id;
      if (replyToMsgId) {
        // Look for parent signal that was created from this telegram message
        // We store telegram_message_id in signal_updates to track replies
        const parentType = "signal";
        
        // Find latest signal (since we don't store telegram msg id on signals, use time-based matching)
        // For now, insert as an update to the most recent signal in this channel
        const visibility = channelType === "vip" ? "vip" : "free";
        const { data: latestSignals } = await supabase
          .from("signals")
          .select("id")
          .eq("visibility", visibility)
          .order("created_at", { ascending: false })
          .limit(10);

        if (latestSignals && latestSignals.length > 0) {
          // Insert as update to the most recent signal
          const { data, error } = await supabase.from("signal_updates").insert({
            parent_id: latestSignals[0].id,
            parent_type: parentType,
            content: cleanText,
            attachments: attachments.length > 0 ? attachments : null,
            telegram_message_id: post.message_id,
          });
          result = { data, error };
          if (!error) console.log(`Update added to signal ${latestSignals[0].id}`);
        } else {
          console.log("No parent signal found for reply");
          result = { data: null, error: null };
        }
      } else {
        result = { data: null, error: null };
      }
    } else if (channelType === "news") {
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
        category: detectedCategory,
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
