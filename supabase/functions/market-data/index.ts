const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYMBOLS: Record<string, { finnhub: string; name: string; asset_type: string }> = {
  XAUUSD: { finnhub: "OANDA:XAU_USD", name: "Gold", asset_type: "metals" },
  XAGUSD: { finnhub: "OANDA:XAG_USD", name: "Silver", asset_type: "metals" },
  EURUSD: { finnhub: "OANDA:EUR_USD", name: "Euro/Dollar", asset_type: "forex" },
  GBPUSD: { finnhub: "OANDA:GBP_USD", name: "Pound/Dollar", asset_type: "forex" },
  USDJPY: { finnhub: "OANDA:USD_JPY", name: "Dollar/Yen", asset_type: "forex" },
  USDCHF: { finnhub: "OANDA:USD_CHF", name: "Dollar/Franc", asset_type: "forex" },
  AUDUSD: { finnhub: "OANDA:AUD_USD", name: "Aussie/Dollar", asset_type: "forex" },
  NZDUSD: { finnhub: "OANDA:NZD_USD", name: "Kiwi/Dollar", asset_type: "forex" },
  BTCUSD: { finnhub: "BINANCE:BTCUSDT", name: "Bitcoin", asset_type: "crypto" },
  ETHUSD: { finnhub: "BINANCE:ETHUSDT", name: "Ethereum", asset_type: "crypto" },
};

interface MarketResult {
  symbol: string;
  name: string;
  asset_type: string;
  price: number;
  change: number;
  change_percent: number;
  high: number;
  low: number;
  last_update: string;
}

// In-memory cache
let cachedResults: MarketResult[] = [];
let lastFetchTime = 0;
const CACHE_TTL_MS = 60_000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    if (cachedResults.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cachedResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    if (!FINNHUB_API_KEY) {
      throw new Error("FINNHUB_API_KEY is not configured");
    }

    const results: MarketResult[] = [];

    for (const [symbol, info] of Object.entries(SYMBOLS)) {
      try {
        const res = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${info.finnhub}&token=${FINNHUB_API_KEY}`
        );
        if (!res.ok) continue;
        const d = await res.json();
        if (d.c && d.c > 0) {
          const change = d.c - (d.pc || d.c);
          results.push({
            symbol,
            name: info.name,
            asset_type: info.asset_type,
            price: d.c,
            change: Number(change.toFixed(5)),
            change_percent: d.pc ? Number(((change / d.pc) * 100).toFixed(2)) : 0,
            high: d.h || d.c,
            low: d.l || d.c,
            last_update: new Date().toISOString(),
          });
        }
      } catch { /* skip */ }
      await new Promise((r) => setTimeout(r, 100));
    }

    // Sort by predefined order
    const order = Object.keys(SYMBOLS);
    results.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol));

    if (results.length > 0) {
      cachedResults = results;
      lastFetchTime = now;
    }

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Market data error:", msg);
    if (cachedResults.length > 0) {
      return new Response(JSON.stringify(cachedResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
