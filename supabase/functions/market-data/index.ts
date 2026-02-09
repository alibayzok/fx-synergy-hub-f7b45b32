const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYMBOL_INFO: Record<string, { name: string; asset_type: string }> = {
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
const CACHE_TTL_MS = 60_000; // 1 minute

// Finnhub for crypto
async function fetchCrypto(apiKey: string): Promise<MarketResult[]> {
  const symbols: Record<string, string> = {
    BTCUSD: "BINANCE:BTCUSDT",
    ETHUSD: "BINANCE:ETHUSDT",
  };
  const results: MarketResult[] = [];
  for (const [sym, fhSym] of Object.entries(symbols)) {
    try {
      const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${fhSym}&token=${apiKey}`);
      if (!res.ok) continue;
      const d = await res.json();
      if (d.c && d.c > 0) {
        const change = d.c - (d.pc || d.c);
        const info = SYMBOL_INFO[sym];
        results.push({
          symbol: sym, name: info.name, asset_type: info.asset_type,
          price: d.c, change: Number(change.toFixed(2)),
          change_percent: d.pc ? Number(((change / d.pc) * 100).toFixed(2)) : 0,
          high: d.h || d.c, low: d.l || d.c,
          last_update: new Date().toISOString(),
        });
      }
    } catch { /* skip */ }
    await new Promise(r => setTimeout(r, 100));
  }
  return results;
}

// Twelve Data for forex & metals - single batch call (uses 1 credit per symbol)
async function fetchForexMetals(apiKey: string): Promise<MarketResult[]> {
  const tdSymbols: Record<string, string> = {
    XAUUSD: "XAU/USD", XAGUSD: "XAG/USD",
    EURUSD: "EUR/USD", GBPUSD: "GBP/USD",
    USDJPY: "USD/JPY", USDCHF: "USD/CHF",
    AUDUSD: "AUD/USD", NZDUSD: "NZD/USD",
  };
  const results: MarketResult[] = [];

  // Use quote endpoint with batch - single request
  const symbolsList = Object.values(tdSymbols).join(",");
  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolsList)}&apikey=${apiKey}`
    );
    if (!res.ok) {
      console.error("Twelve Data batch error:", res.status);
      return results;
    }
    const data = await res.json();
    
    // Check if rate limited
    if (data.code === 429 || data.status === "error") {
      console.error("Twelve Data rate limited:", data.message);
      return results;
    }

    for (const [ourSym, tdSym] of Object.entries(tdSymbols)) {
      try {
        const q = data[tdSym];
        if (!q || q.code || q.status === "error") continue;
        
        const price = parseFloat(q.close);
        const prevClose = parseFloat(q.previous_close);
        if (!price || price <= 0) continue;

        const change = prevClose ? price - prevClose : 0;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;
        const info = SYMBOL_INFO[ourSym];

        results.push({
          symbol: ourSym, name: info.name, asset_type: info.asset_type,
          price,
          change: Number(change.toFixed(5)),
          change_percent: Number(changePct.toFixed(2)),
          high: parseFloat(q.high) || price,
          low: parseFloat(q.low) || price,
          last_update: new Date().toISOString(),
        });
      } catch { /* skip */ }
    }
  } catch (err) {
    console.error("Twelve Data error:", err);
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    // Return cache if fresh
    if (cachedResults.length > 0 && now - lastFetchTime < CACHE_TTL_MS) {
      return new Response(JSON.stringify(cachedResults), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY");

    if (!FINNHUB_API_KEY && !TWELVE_DATA_API_KEY) {
      throw new Error("No market data API keys configured");
    }

    console.log("Fetching fresh market data...");

    const [forexMetals, crypto] = await Promise.all([
      TWELVE_DATA_API_KEY ? fetchForexMetals(TWELVE_DATA_API_KEY) : Promise.resolve([]),
      FINNHUB_API_KEY ? fetchCrypto(FINNHUB_API_KEY) : Promise.resolve([]),
    ]);

    console.log(`ForexMetals: ${forexMetals.length}, Crypto: ${crypto.length}`);

    const allResults = [...forexMetals, ...crypto];

    // Deduplicate
    const seen = new Set<string>();
    const merged: MarketResult[] = [];
    for (const r of allResults) {
      if (!seen.has(r.symbol)) {
        seen.add(r.symbol);
        merged.push(r);
      }
    }

    // Sort
    const order = Object.keys(SYMBOL_INFO);
    merged.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol));

    if (merged.length > 0) {
      cachedResults = merged;
      lastFetchTime = now;
    }

    return new Response(JSON.stringify(merged), {
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
