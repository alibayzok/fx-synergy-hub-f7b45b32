const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Finnhub symbols (best for crypto)
const FINNHUB_SYMBOLS: Record<string, string> = {
  BTCUSD: "BINANCE:BTCUSDT",
  ETHUSD: "BINANCE:ETHUSDT",
};

// Twelve Data symbols (best for forex & metals)
const TWELVEDATA_SYMBOLS: Record<string, string> = {
  XAUUSD: "XAU/USD",
  XAGUSD: "XAG/USD",
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",
  USDCHF: "USD/CHF",
  AUDUSD: "AUD/USD",
  NZDUSD: "NZD/USD",
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

async function fetchFinnhub(apiKey: string): Promise<MarketResult[]> {
  const results: MarketResult[] = [];
  for (const [symbol, finnhubSymbol] of Object.entries(FINNHUB_SYMBOLS)) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=${finnhubSymbol}&token=${apiKey}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      if (data.c && data.c > 0) {
        const change = data.c - (data.pc || data.c);
        const changePct = data.pc ? (change / data.pc) * 100 : 0;
        const info = SYMBOL_INFO[symbol];
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
    } catch { /* skip */ }
    await new Promise((r) => setTimeout(r, 150));
  }
  return results;
}

async function fetchTwelveData(apiKey: string): Promise<MarketResult[]> {
  const results: MarketResult[] = [];
  // Twelve Data supports batch quotes - fetch all at once
  const symbolsList = Object.values(TWELVEDATA_SYMBOLS).join(",");
  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(symbolsList)}&apikey=${apiKey}`
    );
    if (!res.ok) {
      console.error("Twelve Data error:", res.status);
      return results;
    }
    const data = await res.json();

    // Batch response returns object keyed by symbol
    for (const [ourSymbol, tdSymbol] of Object.entries(TWELVEDATA_SYMBOLS)) {
      try {
        const quote = data[tdSymbol as string];
        if (!quote || quote.status === "error") continue;

        const price = parseFloat(quote.close);
        const prevClose = parseFloat(quote.previous_close);
        const high = parseFloat(quote.high);
        const low = parseFloat(quote.low);

        if (!price || price <= 0) continue;

        const change = prevClose ? price - prevClose : 0;
        const changePct = prevClose ? (change / prevClose) * 100 : 0;
        const info = SYMBOL_INFO[ourSymbol];

        results.push({
          symbol: ourSymbol,
          name: info.name,
          asset_type: info.asset_type,
          price,
          change: Number(change.toFixed(5)),
          change_percent: Number(changePct.toFixed(2)),
          high: high || price,
          low: low || price,
          last_update: new Date().toISOString(),
        });
      } catch { /* skip symbol */ }
    }
  } catch (err) {
    console.error("Twelve Data fetch error:", err);
  }
  return results;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY");
    const TWELVE_DATA_API_KEY = Deno.env.get("TWELVE_DATA_API_KEY");

    if (!FINNHUB_API_KEY && !TWELVE_DATA_API_KEY) {
      throw new Error("No market data API keys configured");
    }

    // Fetch from both providers in parallel
    const [finnhubResults, twelveDataResults] = await Promise.all([
      FINNHUB_API_KEY ? fetchFinnhub(FINNHUB_API_KEY) : Promise.resolve([]),
      TWELVE_DATA_API_KEY ? fetchTwelveData(TWELVE_DATA_API_KEY) : Promise.resolve([]),
    ]);

    // Merge: Twelve Data for forex/metals, Finnhub for crypto
    const allResults = [...twelveDataResults, ...finnhubResults];

    // Deduplicate (prefer first occurrence)
    const seen = new Set<string>();
    const merged: MarketResult[] = [];
    for (const r of allResults) {
      if (!seen.has(r.symbol)) {
        seen.add(r.symbol);
        merged.push(r);
      }
    }

    // Sort by predefined order
    const order = Object.keys(SYMBOL_INFO);
    merged.sort((a, b) => order.indexOf(a.symbol) - order.indexOf(b.symbol));

    return new Response(JSON.stringify(merged), {
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
