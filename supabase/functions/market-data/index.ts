const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

const SYMBOL_NAMES: Record<string, { name: string; asset_type: string }> = {
  XAUUSD: { name: "Gold", asset_type: "metals" },
  XAGUSD: { name: "Silver", asset_type: "metals" },
  EURUSD: { name: "Euro/Dollar", asset_type: "forex" },
  GBPUSD: { name: "Pound/Dollar", asset_type: "forex" },
  USDJPY: { name: "Dollar/Yen", asset_type: "forex" },
  USDCHF: { name: "Dollar/Franc", asset_type: "forex" },
  AUDUSD: { name: "Aussie/Dollar", asset_type: "forex" },
  NZDUSD: { name: "Kiwi/Dollar", asset_type: "forex" },
  BTCUSD: { name: "Bitcoin", asset_type: "crypto" },
  ETHUSD: { name: "Ethereum", asset_type: "crypto" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    const results = [];

    for (const [symbol, finnhubSymbol] of Object.entries(SYMBOL_MAP)) {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${FINNHUB_API_KEY}`
        );
        if (!res.ok) continue;
        const data = await res.json();
        
        // c=current, pc=previous close, h=high, l=low, o=open
        if (data.c && data.c > 0) {
          const change = data.c - (data.pc || data.o || data.c);
          const changePct = data.pc ? ((change / data.pc) * 100) : 0;
          const info = SYMBOL_NAMES[symbol];
          
          results.push({
            symbol,
            name: info.name,
            asset_type: info.asset_type,
            price: data.c,
            change: Number(change.toFixed(5)),
            change_percent: Number(changePct.toFixed(2)),
            high: data.h || data.c,
            low: data.l || data.c,
            last_update: new Date().toISOString(),
          });
        }
      } catch {
        // Skip failed symbols
      }
      // Rate limit: Finnhub free = 60/min
      await new Promise((r) => setTimeout(r, 150));
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Market data error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
