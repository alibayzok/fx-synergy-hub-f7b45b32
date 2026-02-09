import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Finnhub symbol mapping
const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "OANDA:XAU_USD",
  XAGUSD: "OANDA:XAG_USD",
  EURUSD: "OANDA:EUR_USD",
  GBPUSD: "OANDA:GBP_USD",
  USDJPY: "OANDA:USD_JPY",
  USDCHF: "OANDA:USD_CHF",
  AUDUSD: "OANDA:AUD_USD",
  NZDUSD: "OANDA:NZD_USD",
  BTCUSD: "BINANCE:BTCUSDT",
  ETHUSD: "BINANCE:ETHUSDT",
};

async function fetchPrice(
  symbol: string,
  apiKey: string
): Promise<number | null> {
  const finnhubSymbol = SYMBOL_MAP[symbol];
  if (!finnhubSymbol) return null;

  try {
    const res = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.c || null; // c = current price
  } catch {
    return null;
  }
}

function checkTradeHit(
  direction: string,
  currentPrice: number,
  entryPrice: number,
  slPrice: number,
  tpPrices: number[]
): { status: string; note: string } | null {
  if (direction === "buy") {
    // SL hit: price dropped to or below SL
    if (currentPrice <= slPrice) {
      return {
        status: "sl_hit",
        note: `⛔ ضرب وقف الخسارة - السعر وصل ${currentPrice}`,
      };
    }
    // Check TP levels (highest first)
    const sortedTPs = [...tpPrices].sort((a, b) => b - a);
    for (const tp of sortedTPs) {
      if (currentPrice >= tp) {
        const tpIndex = tpPrices.indexOf(tp) + 1;
        return {
          status: "tp_hit",
          note: `✅ ضرب الهدف ${tpIndex} - السعر وصل ${currentPrice}`,
        };
      }
    }
  } else {
    // sell
    // SL hit: price rose to or above SL
    if (currentPrice >= slPrice) {
      return {
        status: "sl_hit",
        note: `⛔ ضرب وقف الخسارة - السعر وصل ${currentPrice}`,
      };
    }
    // Check TP levels (lowest first for sell)
    const sortedTPs = [...tpPrices].sort((a, b) => a - b);
    for (const tp of sortedTPs) {
      if (currentPrice <= tp) {
        const tpIndex = tpPrices.indexOf(tp) + 1;
        return {
          status: "tp_hit",
          note: `✅ ضرب الهدف ${tpIndex} - السعر وصل ${currentPrice}`,
        };
      }
    }
  }

  return null; // No hit
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all running trades
    const { data: trades, error: fetchError } = await supabase
      .from("trades")
      .select("id, symbol, direction, entry_price, sl_price, tp_prices, created_by")
      .eq("status", "running");

    if (fetchError) throw fetchError;
    if (!trades || trades.length === 0) {
      return new Response(
        JSON.stringify({ message: "No running trades", checked: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get unique symbols
    const uniqueSymbols = [...new Set(trades.map((t) => t.symbol))];

    // Fetch prices for all symbols (with rate limiting - Finnhub free = 60/min)
    const prices: Record<string, number> = {};
    for (const symbol of uniqueSymbols) {
      const price = await fetchPrice(symbol, FINNHUB_API_KEY);
      if (price) prices[symbol] = price;
      // Small delay to respect rate limits
      await new Promise((r) => setTimeout(r, 200));
    }

    let updated = 0;
    const results: Array<{ trade_id: string; symbol: string; action: string }> = [];

    // Check each trade
    for (const trade of trades) {
      const currentPrice = prices[trade.symbol];
      if (!currentPrice) continue;

      const hit = checkTradeHit(
        trade.direction,
        currentPrice,
        trade.entry_price,
        trade.sl_price,
        trade.tp_prices
      );

      if (hit) {
        // Update trade status
        const { error: updateError } = await supabase
          .from("trades")
          .update({
            status: hit.status,
            last_update_note: hit.note,
            updated_at: new Date().toISOString(),
          })
          .eq("id", trade.id);

        if (!updateError) {
          updated++;
          results.push({
            trade_id: trade.id,
            symbol: trade.symbol,
            action: hit.status,
          });

          // Notify followers
          const { data: followers } = await supabase
            .from("trade_followers")
            .select("user_id")
            .eq("trade_id", trade.id);

          if (followers && followers.length > 0) {
            const statusText = hit.status === "tp_hit" ? "ضرب الهدف ✅" : "ضرب وقف الخسارة ⛔";
            const notifications = followers.map((f) => ({
              user_id: f.user_id,
              type: "trade_update",
              title: `تحديث صفقة ${trade.symbol}`,
              message: `${statusText} - ${trade.symbol} @ ${currentPrice}`,
              data: {
                trade_id: trade.id,
                status: hit.status,
                price: currentPrice,
              },
            }));

            await supabase.from("user_notifications").insert(notifications);
          }

          // Admin notification
          await supabase.from("admin_notifications").insert({
            type: "trade_update",
            title: `تحديث تلقائي: ${trade.symbol}`,
            message: hit.note,
            data: {
              trade_id: trade.id,
              symbol: trade.symbol,
              status: hit.status,
              price: currentPrice,
            },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        checked: trades.length,
        updated,
        prices,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Trade checker error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
