/**
 * seed-fund.mjs
 *
 * Fetches real fund holdings from Avanza's public API and seeds them into
 * Supabase so the Next.js app can use them for news lookups.
 *
 * Usage (search by name — recommended):
 *   node scripts/seed-fund.mjs --name "Avanza Zero"
 *   node scripts/seed-fund.mjs --name "VanEck Gold Miners"
 *
 * Usage (manual override if search fails):
 *   node scripts/seed-fund.mjs --name "My Fund" --id 1149494 --isin LU1989766289
 *
 * Requirements:
 *   - .env.local must contain FINNHUB_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *     and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   - Node.js 16+ (uses built-in https module — no extra install needed)
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import https from "https";

// ── Load .env.local ──────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, "../.env.local");

try {
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split(/\r?\n/)) {
    const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch (err) {
  console.error(`Warning: could not load .env.local (${err.message}). Falling back to process env.`);
}

const FINNHUB_KEY  = process.env.FINNHUB_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// ── Parse CLI arguments ──────────────────────────────────────────────────────
const args = {};
for (let i = 2; i < process.argv.length - 1; i++) {
  if (process.argv[i].startsWith("--")) {
    args[process.argv[i].slice(2)] = process.argv[i + 1];
  }
}

const { name: queryName, id: manualId, isin: manualIsin } = args;

if (!queryName) {
  console.error(
    "\nUsage:\n" +
    "  node scripts/seed-fund.mjs --name \"<Fund Name>\"\n" +
    "  node scripts/seed-fund.mjs --name \"<Fund Name>\" --id <avanzaId> --isin <ISIN>\n\n" +
    "Examples:\n" +
    "  node scripts/seed-fund.mjs --name \"Avanza Zero\"\n" +
    "  node scripts/seed-fund.mjs --name \"VanEck Gold Miners\"\n"
  );
  process.exit(1);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** HTTPS GET or POST → parsed JSON */
function fetchJson(url, { method = "GET", body = null } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
        "Referer": "https://www.avanza.se/fonder/handla-fonder.html",
        "Origin": "https://www.avanza.se",
        ...(bodyStr ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    };

    const req = https.request(options, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`JSON parse failed for ${url}`));
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/** Wait ms milliseconds */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Replicates formatTicker from src/lib/ticker-utils.ts.
 * Appends the exchange suffix that Finnhub expects for non-US stocks.
 */
function formatTicker(symbol, country) {
  const suffixes = {
    SE: ".ST", DK: ".CO", FI: ".HE", NO: ".OL",
    DE: ".DE", GB: ".L",  UK: ".L",  CH: ".SW",
    NL: ".AS", AU: ".AX", HK: ".HK", CA: ".TO",
  };
  // Normalise spaces → dashes (Finnhub displaySymbol uses spaces)
  const normalised = symbol.replace(/\s+/g, "-");
  // If it already has any exchange suffix, return as-is
  if (/\.\w{1,3}$/.test(normalised)) return normalised;
  if (!country || country === "US") return normalised;
  const suffix = suffixes[country];
  return suffix ? normalised + suffix : normalised;
}

/**
 * Searches the Avanza fund-guide/list endpoint for a fund by name.
 * Returns { avanzaId, isin, name } or null if not found.
 *
 * Strategy:
 *   1. Try with a query param — Avanza may support server-side filtering.
 *   2. If the response doesn't match, fall back to fetching without filter
 *      and searching the full list locally.
 */
async function searchAvanzaFund(fundName) {
  const normalised = fundName.toLowerCase().trim();
  const url = "https://www.avanza.se/_api/fund-guide/list?shouldCheckFundExcludedFromPromotion=true";

  // Base body matching exactly what the browser sends
  const baseBody = {
    startIndex: 0,
    managedType: "ANY",
    svanenMark: false,
    sortField: "developmentThreeYears",
    sortDirection: "DESCENDING",
    name: "",
    commonRegionFilter: [],
    otherRegionFilter: [],
    fundTypeFilter: [],
    industryFilter: [],
    companyFilter: [],
    ratingFilter: [],
    riskFilter: [],
    sustainabilityRatingFilter: [],
    euArticleTypeFilter: [],
    alignmentFilter: [],
    sustainableDevelopmentGoalsAlignmentFilter: [],
    productInvolvementsFilter: [],
    recommendedHoldingPeriodFilter: [],
    environmentalRatingFilter: [],
    socialRatingFilter: [],
    governanceRatingFilter: [],
    interestTypeFilter: [],
    cashDividends: false,
    maxTotalFee: null,
  };

  // Attempt 1: pass the fund name as a server-side filter
  const filtered = await fetchJson(url, {
    method: "POST",
    body: { ...baseBody, name: fundName },
  });

  const filteredFunds = filtered.fundListViews ?? [];
  if (filteredFunds.length > 0) {
    const exact = filteredFunds.find((f) => f.name.toLowerCase() === normalised)
      ?? filteredFunds.find((f) => f.name.toLowerCase().includes(normalised));
    if (exact) return exact;
  }

  // Attempt 2: name filter returned nothing — paginate through full list
  console.log("  (server-side filter returned nothing, paginating full list…)");
  let startIndex = 0;
  const pageSize  = 100;

  while (true) {
    const data = await fetchJson(url, {
      method: "POST",
      body: { ...baseBody, startIndex },
    });

    const funds = data.fundListViews ?? [];
    if (!funds.length) break;

    const match = funds.find((f) => f.name.toLowerCase() === normalised)
      ?? funds.find((f) => f.name.toLowerCase().startsWith(normalised))
      ?? funds.find((f) => f.name.toLowerCase().includes(normalised));

    if (match) return match;

    // Stop if we've received fewer results than a full page
    if (funds.length < pageSize) break;
    startIndex += pageSize;
  }

  return null;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  if (!FINNHUB_KEY)
    throw new Error("FINNHUB_API_KEY is not set. Check your .env.local file.");
  if (!SUPABASE_URL || !SUPABASE_KEY)
    throw new Error("Supabase env vars are not set. Check your .env.local file.");

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // ── Step 1: Resolve fund ID and ISIN ────────────────────────────────────────
  let avanzaId = manualId;
  let fundIsin  = manualIsin;
  let fundName  = queryName;

  if (avanzaId && fundIsin) {
    // Manual override — use as-is
    console.log(`\nUsing manual override: ID=${avanzaId}, ISIN=${fundIsin}`);
  } else {
    // Auto-search
    console.log(`\nSearching Avanza for: "${queryName}"…`);
    const found = await searchAvanzaFund(queryName);

    if (!found) {
      console.error(
        `\nNo fund found matching "${queryName}".\n` +
        `Check the spelling, or use manual override:\n` +
        `  node scripts/seed-fund.mjs --name "..." --id <avanzaId> --isin <ISIN>\n`
      );
      process.exit(1);
    }

    avanzaId = found.orderbookId;
    fundIsin  = found.isin;
    fundName  = found.name; // use the exact name from Avanza
  }

  console.log("\n─────────────────────────────────────────");
  console.log(` Fund      : ${fundName}`);
  console.log(` ISIN      : ${fundIsin}`);
  console.log(` Avanza ID : ${avanzaId}`);
  console.log("─────────────────────────────────────────\n");

  // ── Step 2: Fetch holdings from Avanza ──────────────────────────────────────
  console.log("Fetching holdings from Avanza…");
  const avanzaData = await fetchJson(
    `https://www.avanza.se/_api/fund-reference/portfolio-data/${avanzaId}`
  );

  const holdings = avanzaData.holdingChartData ?? [];
  if (!holdings.length) {
    console.error("No holdings returned. The fund may not publish portfolio data.");
    process.exit(1);
  }
  console.log(`Found ${holdings.length} holdings.\n`);

  // ── Step 3: Upsert the fund row ──────────────────────────────────────────────
  const { error: fundErr } = await supabase
    .from("funds")
    .upsert({ isin: fundIsin, name: fundName }, { onConflict: "isin" });
  if (fundErr) throw new Error("Fund upsert failed: " + fundErr.message);
  console.log(`✓  Fund saved: ${fundName}\n`);

  // ── Step 4: Resolve tickers and seed holdings ────────────────────────────────
  let seeded  = 0;
  let skipped = 0;

  for (const holding of holdings) {
    const { name, y: weight, countryCode, isin } = holding;

    if (!isin) {
      console.log(`  –  Skipping "${name}" (no ISIN in Avanza data)`);
      skipped++;
      continue;
    }

    // Search Finnhub by ISIN to resolve the ticker symbol
    await sleep(350); // stay within free-tier rate limit
    let search;
    try {
      search = await fetchJson(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(isin)}&token=${FINNHUB_KEY}`
      );
    } catch (err) {
      console.log(`  ✗  ${name} — Finnhub search error: ${err.message}`);
      skipped++;
      continue;
    }

    const match = (search.result ?? []).find(
      (r) => r.type === "Common Stock" || r.type === "EQS"
    );

    if (!match) {
      console.log(`  ✗  ${name.padEnd(32)} — not found on Finnhub (ISIN: ${isin})`);
      skipped++;
      continue;
    }

    const ticker = formatTicker(match.displaySymbol, countryCode);

    // Fetch company profile for sector classification (use ISIN — more reliable than symbol)
    await sleep(350);
    let sector = "Unknown";
    try {
      const profile = await fetchJson(
        `https://finnhub.io/api/v1/stock/profile2?isin=${encodeURIComponent(isin)}&token=${FINNHUB_KEY}`
      );
      sector = profile.finnhubIndustry ?? "Unknown";
    } catch {
      // non-fatal — falls back to "Unknown"
    }

    // Upsert stock
    const { error: stockErr } = await supabase
      .from("stocks")
      .upsert(
        { ticker, name, country: countryCode, sector },
        { onConflict: "ticker" }
      );
    if (stockErr) {
      console.log(`  ✗  ${ticker.padEnd(16)} — stocks upsert: ${stockErr.message}`);
      continue;
    }

    // Upsert fund_holding
    const { error: holdingErr } = await supabase
      .from("fund_holdings")
      .upsert(
        { fund_isin: fundIsin, stock_ticker: ticker, weight_percentage: weight },
        { onConflict: "fund_isin,stock_ticker", ignoreDuplicates: true }
      );
    if (holdingErr) {
      console.log(`  ✗  ${ticker.padEnd(16)} — holding upsert: ${holdingErr.message}`);
      continue;
    }

    console.log(`  ✓  ${ticker.padEnd(16)} ${name.padEnd(32)} [${sector}]`);
    seeded++;
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log("\n─────────────────────────────────────────");
  console.log(` ✓  Seeded  : ${seeded} holdings`);
  if (skipped) console.log(` –  Skipped : ${skipped} (no ticker on Finnhub / no ISIN)`);
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("\nFatal error:", err.message);
  process.exit(1);
});
