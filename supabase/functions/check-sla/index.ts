import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find open tickets that have breached SLA but haven't been notified yet
    const now = new Date().toISOString();
    const { data: breachedTickets, error } = await supabase
      .from("support_tickets")
      .select("id, user_id, subject, priority, assigned_to, sla_deadline, created_at")
      .eq("status", "open")
      .eq("sla_notified", false)
      .not("sla_deadline", "is", null)
      .lt("sla_deadline", now);

    if (error) {
      console.error("Error fetching breached tickets:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!breachedTickets || breachedTickets.length === 0) {
      return new Response(JSON.stringify({ ok: true, breached: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${breachedTickets.length} SLA-breached tickets`);

    // Get all active support agents
    const { data: agents } = await supabase
      .from("support_agents")
      .select("user_id")
      .eq("is_active", true);

    const agentUserIds = (agents || []).map((a: any) => a.user_id);

    // For each breached ticket:
    for (const ticket of breachedTickets) {
      // 1. Mark as breached and notified
      await supabase
        .from("support_tickets")
        .update({ sla_breached: true, sla_notified: true })
        .eq("id", ticket.id);

      // 2. Calculate how late
      const deadline = new Date(ticket.sla_deadline).getTime();
      const nowMs = Date.now();
      const lateMins = Math.floor((nowMs - deadline) / 60000);
      const lateText = lateMins < 60
        ? `${lateMins} دقيقة`
        : `${Math.floor(lateMins / 60)} ساعة ${lateMins % 60} دقيقة`;

      // 3. Notify assigned agent (or all agents if unassigned)
      const targetAgents = ticket.assigned_to
        ? [ticket.assigned_to]
        : agentUserIds;

      const notifications = targetAgents.map((agentId: string) => ({
        user_id: agentId,
        title: "⚠️ تجاوز وقت SLA",
        message: `التذكرة "${ticket.subject}" تأخرت ${lateText} عن موعد الاستجابة`,
        type: "sla_breach",
        data: { ticket_id: ticket.id, priority: ticket.priority, late_minutes: lateMins },
      }));

      if (notifications.length > 0) {
        await supabase.from("user_notifications").insert(notifications);
      }

      // 4. Also add admin notification
      await supabase.from("admin_notifications").insert({
        type: "sla_breach",
        title: "⚠️ تجاوز SLA",
        message: `التذكرة "${ticket.subject}" (أولوية: ${ticket.priority}) تأخرت ${lateText}`,
        data: { ticket_id: ticket.id, priority: ticket.priority, late_minutes: lateMins },
      });

      console.log(`SLA breach notification sent for ticket ${ticket.id}, late by ${lateText}`);
    }

    return new Response(
      JSON.stringify({ ok: true, breached: breachedTickets.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("SLA check error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
