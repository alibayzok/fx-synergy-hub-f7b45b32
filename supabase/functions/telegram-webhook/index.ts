import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Telegram text formatting → HTML ───
function applyEntities(text: string, entities: any[]): string {
  if (!entities || entities.length === 0) return escapeHtml(text);

  // Convert string to array of code points for correct offset handling
  const codePoints = [...text];
  const result: string[] = [];
  let pos = 0;

  // Sort entities by offset
  const sorted = [...entities].sort((a, b) => a.offset - b.offset || b.length - a.length);

  for (const entity of sorted) {
    // Add text before this entity
    if (entity.offset > pos) {
      result.push(escapeHtml(codePoints.slice(pos, entity.offset).join("")));
    }

    const entityText = codePoints.slice(entity.offset, entity.offset + entity.length).join("");

    switch (entity.type) {
      case "bold":
        result.push(`<strong>${escapeHtml(entityText)}</strong>`);
        break;
      case "italic":
        result.push(`<em>${escapeHtml(entityText)}</em>`);
        break;
      case "underline":
        result.push(`<u>${escapeHtml(entityText)}</u>`);
        break;
      case "strikethrough":
        result.push(`<s>${escapeHtml(entityText)}</s>`);
        break;
      case "code":
        result.push(`<code>${escapeHtml(entityText)}</code>`);
        break;
      case "pre":
        result.push(`<pre>${escapeHtml(entityText)}</pre>`);
        break;
      case "text_link":
        result.push(`<a href="${entity.url}" target="_blank" rel="noopener">${escapeHtml(entityText)}</a>`);
        break;
      case "url":
        result.push(`<a href="${escapeHtml(entityText)}" target="_blank" rel="noopener">${escapeHtml(entityText)}</a>`);
        break;
      case "text_mention":
        result.push(`<strong>@${escapeHtml(entity.user?.first_name || entityText)}</strong>`);
        break;
      case "hashtag":
      case "mention":
        result.push(`<strong>${escapeHtml(entityText)}</strong>`);
        break;
      default:
        result.push(escapeHtml(entityText));
    }

    pos = entity.offset + entity.length;
  }

  // Add remaining text
  if (pos < codePoints.length) {
    result.push(escapeHtml(codePoints.slice(pos).join("")));
  }

  // Convert newlines to <br>
  return result.join("").replace(/\n/g, "<br>");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ─── Extract title from first line ───
function extractTitle(text: string): { title: string; content: string } {
  if (!text) return { title: "إشارة جديدة", content: "" };
  const lines = text.split("\n");
  const title = lines[0].replace(/^[#\s*_~`]+/, "").trim().substring(0, 200) || "إشارة جديدة";
  const content = lines.length > 1 ? lines.slice(1).join("\n").trim() : "";
  return { title, content };
}

// ─── Download photo from Telegram and upload to Storage ───
async function downloadAndUploadPhoto(
  botToken: string,
  fileId: string,
  supabase: any
): Promise<string | null> {
  try {
    // Get file path from Telegram
    const fileRes = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      console.error("Failed to get file path:", fileData);
      return null;
    }

    const filePath = fileData.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

    // Download the file
    const downloadRes = await fetch(fileUrl);
    if (!downloadRes.ok) {
      console.error("Failed to download file:", downloadRes.status);
      return null;
    }

    const fileBuffer = await downloadRes.arrayBuffer();
    const ext = filePath.split(".").pop() || "jpg";
    const storagePath = `telegram/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("telegram-images")
      .upload(storagePath, fileBuffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("telegram-images")
      .getPublicUrl(storagePath);

    return urlData?.publicUrl || null;
  } catch (err) {
    console.error("Photo processing error:", err);
    return null;
  }
}

// ─── Get best photo size ───
function getBestPhotoFileId(photos: any[]): string | null {
  if (!photos || photos.length === 0) return null;
  // Get the largest photo (last in array)
  return photos[photos.length - 1].file_id;
}

// ─── Media group cache (in-memory, per invocation) ───
const mediaGroupCache = new Map<string, { messageId: number; signalId?: string; articleId?: string; timer?: number }>();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ─── Verify webhook secret ───
    const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");

    if (webhookSecret && secretHeader !== webhookSecret) {
      console.error("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
    }

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body).substring(0, 500));

    // Only process channel posts
    const post = body.channel_post;
    if (!post) {
      return new Response(JSON.stringify({ ok: true, skipped: "not a channel_post" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Init Supabase client ───
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
    const publicChatId = Deno.env.get("TELEGRAM_PUBLIC_CHAT_ID");
    const vipChatId = Deno.env.get("TELEGRAM_VIP_CHAT_ID");
    const newsChatId = Deno.env.get("TELEGRAM_NEWS_CHAT_ID");

    const chatId = String(post.chat.id);
    const messageId = post.message_id;
    const text = post.text || post.caption || "";
    const entities = post.entities || post.caption_entities || [];
    const replyToMessage = post.reply_to_message;
    const mediaGroupId = post.media_group_id;

    // ─── Extract hashtags ───
    const hashtags = entities
      .filter((e: any) => e.type === "hashtag")
      .map((e: any) => {
        const codePoints = [...text];
        return codePoints.slice(e.offset, e.offset + e.length).join("").toLowerCase();
      });

    const hasPublishTag = hashtags.some((tag: string) =>
      tag === "#نشر" || tag === "#publish"
    );

    const hasSignalTag = hashtags.some((tag: string) =>
      tag === "#إشارة" || tag === "#signal" || tag === "#اشارة"
    );

    const hasArticleTag = hashtags.some((tag: string) =>
      tag === "#مقال" || tag === "#article"
    );

    // Replies (updates) don't need the hashtag - they link to existing signals
    const isReply = !!replyToMessage;

    if (!hasPublishTag && !isReply) {
      console.log("Skipped: no #نشر or #publish hashtag found");
      return new Response(JSON.stringify({ ok: true, skipped: "no_publish_hashtag" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Determine destination based on hashtag + channel ───
    // Room ID mapping for each Telegram channel
    const channelToRoomMap: Record<string, string> = {};
    if (publicChatId) channelToRoomMap[publicChatId] = "announcements";
    if (vipChatId) channelToRoomMap[vipChatId] = "vip-channel";
    if (newsChatId) channelToRoomMap[newsChatId] = "news";

    let destination: "signal_free" | "signal_vip" | "article" | "room_message" | null = null;
    let targetRoomId: string | null = null;

    if (hasSignalTag) {
      // #إشارة → signal (channel determines free/vip)
      if (publicChatId && chatId === publicChatId) {
        destination = "signal_free";
      } else if (vipChatId && chatId === vipChatId) {
        destination = "signal_vip";
      } else {
        destination = "signal_free";
      }
    } else if (hasArticleTag) {
      // #مقال → article
      destination = "article";
    } else {
      // Default (no type tag) → room message based on source channel
      targetRoomId = channelToRoomMap[chatId] || null;
      if (targetRoomId) {
        destination = "room_message";
      }
    }

    if (!destination) {
      console.log("Unknown chat ID or could not determine destination:", chatId);
      return new Response(JSON.stringify({ ok: true, skipped: "unknown_destination" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Format text WITH entities FIRST (before cleaning) to preserve offsets ───
    const fullFormattedContent = applyEntities(text, entities);

    // ─── Then clean control hashtags from both raw and formatted text ───
    const controlHashtagRegex = /#نشر|#publish|#إشارة|#اشارة|#signal|#مقال|#article|#تعليم|#education|#تحليل|#analysis|#أخبار|#news|#crypto|#كريبتو/gi;
    const cleanText = text.replace(controlHashtagRegex, "").replace(/\s{2,}/g, " ").trim();
    const cleanFormattedContent = fullFormattedContent.replace(controlHashtagRegex, "").replace(/\s{2,}/g, " ").trim();

    console.log(`Processing: destination=${destination}, messageId=${messageId}, hasReply=${isReply}, mediaGroup=${mediaGroupId || "none"}`);

    // ─── Process photo if present ───
    let photoUrl: string | null = null;
    if (post.photo) {
      const bestFileId = getBestPhotoFileId(post.photo);
      if (bestFileId) {
        photoUrl = await downloadAndUploadPhoto(botToken, bestFileId, supabase);
      }
    }

    // ─── Extract title from clean text ───
    const { title, content: bodyContent } = extractTitle(cleanText);

    // ─── Handle replies (signal updates) ───
    if (replyToMessage && (destination === "signal_free" || destination === "signal_vip")) {
      const originalMessageId = replyToMessage.message_id;

      // Find the original signal by telegram_message_id
      const { data: originalSignal } = await supabase
        .from("signals")
        .select("id")
        .eq("telegram_message_id", originalMessageId)
        .maybeSingle();

      if (originalSignal) {
        // Insert as signal update
        const updateData: any = {
          parent_id: originalSignal.id,
          parent_type: "signal",
          content: cleanFormattedContent || "تحديث",
          telegram_message_id: messageId,
        };

        if (photoUrl) {
          updateData.attachments = [photoUrl];
        }

        const { error: updateError } = await supabase
          .from("signal_updates")
          .insert(updateData);

        if (updateError) {
          console.error("Error inserting signal update:", updateError);
        } else {
          console.log("Signal update added for signal:", originalSignal.id);
        }

        return new Response(
          JSON.stringify({ ok: true, action: "signal_update", signal_id: originalSignal.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // If original signal not found, treat as new signal
      console.log("Original signal not found for reply, creating new signal");
    }

    // ─── Handle media groups (album) ───
    if (mediaGroupId && (destination === "signal_free" || destination === "signal_vip")) {
      const cached = mediaGroupCache.get(mediaGroupId);

      if (cached && cached.signalId) {
        // Already created the signal, just add the photo
        if (photoUrl) {
          const { data: existing } = await supabase
            .from("signals")
            .select("attachments")
            .eq("id", cached.signalId)
            .single();

          const currentAttachments = existing?.attachments || [];
          await supabase
            .from("signals")
            .update({ attachments: [...currentAttachments, photoUrl] })
            .eq("id", cached.signalId);

          console.log("Added photo to existing media group signal:", cached.signalId);
        }

        return new Response(
          JSON.stringify({ ok: true, action: "media_group_photo_added", signal_id: cached.signalId }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // First message in media group - create the signal and cache it
    }

    // ─── Insert signal (free or VIP) ───
    if (destination === "signal_free" || destination === "signal_vip") {
      const signalData: any = {
        title: title,
        content: cleanFormattedContent || title,
        visibility: destination === "signal_free" ? "free" : "vip",
        telegram_message_id: messageId,
      };

      if (photoUrl) {
        signalData.attachments = [photoUrl];
      }

      const { data: newSignal, error: signalError } = await supabase
        .from("signals")
        .insert(signalData)
        .select("id")
        .single();

      if (signalError) {
        console.error("Error inserting signal:", signalError);
        return new Response(JSON.stringify({ error: "Failed to insert signal" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Cache for media group
      if (mediaGroupId && newSignal) {
        mediaGroupCache.set(mediaGroupId, { messageId, signalId: newSignal.id });
      }

      console.log("Signal created:", newSignal?.id, "visibility:", signalData.visibility);

      return new Response(
        JSON.stringify({ ok: true, action: "signal_created", signal_id: newSignal?.id, visibility: signalData.visibility }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Insert article ───
    if (destination === "article") {
      // For articles: first line is title, rest is content
      const articleTitle = title || "مقال جديد";
      let articleContent = cleanFormattedContent;

      // If there's a photo, prepend it as an image tag in the content
      if (photoUrl) {
        articleContent = `<img src="${photoUrl}" alt="صورة المقال" style="max-width:100%;border-radius:8px;margin-bottom:16px;" /><br>${articleContent}`;
      }

      // Detect category from hashtags (already extracted above)
      let category = "general";
      for (const tag of hashtags) {
        if (tag === "#تعليم" || tag === "#education") category = "education";
        else if (tag === "#تحليل" || tag === "#analysis") category = "analysis";
        else if (tag === "#أخبار" || tag === "#news") category = "news";
        else if (tag === "#crypto" || tag === "#كريبتو") category = "crypto";
      }

      const articleData: any = {
        title_ar: articleTitle,
        title_en: articleTitle,
        content_ar: articleContent,
        content_en: articleContent,
        category: category,
        is_published: true,
        image_url: photoUrl,
        telegram_message_id: messageId,
      };

      const { data: newArticle, error: articleError } = await supabase
        .from("articles")
        .insert(articleData)
        .select("id")
        .single();

      if (articleError) {
        console.error("Error inserting article:", articleError);
        return new Response(JSON.stringify({ error: "Failed to insert article" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Article created:", newArticle?.id);

      return new Response(
        JSON.stringify({ ok: true, action: "article_created", article_id: newArticle?.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ─── Insert room message (default: publish to community channel) ───
    if (destination === "room_message" && targetRoomId) {
      // Build message content with photo if present
      let messageContent = cleanFormattedContent || cleanText;
      if (photoUrl) {
        messageContent = `<img src="${photoUrl}" alt="" style="max-width:100%;border-radius:8px;margin-bottom:8px;" /><br>${messageContent}`;
      }

      // Get an admin user to post as (the bot posts on behalf of an admin)
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .limit(1)
        .single();

      const botUserId = adminRole?.user_id;
      if (!botUserId) {
        console.error("No admin user found to post room message");
        return new Response(JSON.stringify({ error: "No admin user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newMessage, error: msgError } = await supabase
        .from("room_messages")
        .insert({
          room_id: targetRoomId,
          user_id: botUserId,
          content: messageContent,
        })
        .select("id")
        .single();

      if (msgError) {
        console.error("Error inserting room message:", msgError);
        return new Response(JSON.stringify({ error: "Failed to insert room message" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Room message created:", newMessage?.id, "in room:", targetRoomId);

      return new Response(
        JSON.stringify({ ok: true, action: "room_message_created", message_id: newMessage?.id, room_id: targetRoomId }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
