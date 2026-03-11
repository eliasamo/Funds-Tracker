import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { formatTicker, normalizeFinnhubTicker } from "@/lib/ticker-utils";

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Avanza helpers ────────────────────────────────────────────────────────────

async function fetchAvanza(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/json",
      "Accept-Language": "sv-SE,sv;q=0.9",
      Referer: "https://www.avanza.se/fonder/handla-fonder.html",
      Origin: "https://www.avanza.se",
      ...init?.headers,
    },
  });
  if (!res.ok) throw new Error(`Avanza HTTP ${res.status}`);
  return res.json();
}

const LIST_URL =
  "https://www.avanza.se/_api/fund-guide/list?shouldCheckFundExcludedFromPromotion=true";

const BASE_BODY = {
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

async function postList(body: object) {
  return fetchAvanza(LIST_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function findAvanzaFund(name: string) {
  const q = name.toLowerCase().trim();
  const findMatch = (funds: { name: string }[]) =>
    funds.find((f) => f.name.toLowerCase() === q) ??
    funds.find((f) => f.name.toLowerCase().startsWith(q)) ??
    funds.find((f) => f.name.toLowerCase().includes(q)) ??
    null;

  // Try server-side name filter first
  const filtered = await postList({ ...BASE_BODY, name });
  const filteredFunds = (filtered.fundListViews ?? []) as { name: string }[];
  if (filteredFunds.length > 0) {
    const m = findMatch(filteredFunds);
    if (m) return m;
  }

  // Paginate the full list
  let startIndex = 0;
  while (true) {
    const data = await postList({ ...BASE_BODY, startIndex });
    const funds = (data.fundListViews ?? []) as { name: string }[];
    if (!funds.length) break;
    const m = findMatch(funds);
    if (m) return m;
    if (funds.length < 100) break;
    startIndex += 100;
  }
  return null;
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fundName } = await request.json();

    if (!fundName || typeof fundName !== "string") {
      return NextResponse.json({ error: "fundName is required" }, { status: 400 });
    }
    if (!FINNHUB_KEY) {
      return NextResponse.json(
        { error: "FINNHUB_API_KEY is not configured on the server" },
        { status: 500 }
      );
    }

    // ── Step 1: Find fund on Avanza ──────────────────────────────────────────
    const avanzaFund = (await findAvanzaFund(fundName)) as {
      isin: string;
      name: string;
      orderbookId: string;
    } | null;

    if (!avanzaFund) {
      return NextResponse.json(
        { error: `Fund "${fundName}" not found on Avanza. Check spelling.` },
        { status: 404 }
      );
    }

    const { isin: fundIsin, name: resolvedName, orderbookId: avanzaId } = avanzaFund;

    // ── Step 2: Return early if already fully cached ─────────────────────────
    const { data: existing } = await supabase
      .from("fund_holdings")
      .select("stock_ticker")
      .eq("fund_isin", fundIsin)
      .limit(1);

    if (existing && existing.length > 0) {
      // Fund data already cached — just make sure this user has it in their list
      const { error: linkErr } = await supabase
        .from("user_funds")
        .upsert({ user_id: user.id, fund_isin: fundIsin }, { onConflict: "user_id,fund_isin", ignoreDuplicates: true });
      if (linkErr) {
        console.error("user_funds upsert failed:", linkErr);
        return NextResponse.json({ error: "Failed to save fund to your list: " + linkErr.message }, { status: 500 });
      }

      return NextResponse.json({
        message: "Fund holdings are up to date (cached)",
        fund: { isin: fundIsin, name: resolvedName },
        cached: true,
      });
    }

    // ── Step 3: Fetch holdings from Avanza ───────────────────────────────────
    const portfolio = await fetchAvanza(
      `https://www.avanza.se/_api/fund-reference/portfolio-data/${avanzaId}`
    );
    const holdings: {
      name: string;
      y: number;
      countryCode: string;
      isin: string;
    }[] = portfolio.holdingChartData ?? [];

    if (!holdings.length) {
      return NextResponse.json(
        { error: "This fund does not publish portfolio data on Avanza." },
        { status: 404 }
      );
    }

    // ── Step 4: Upsert fund row and link to user ─────────────────────────────
    const { error: fundErr } = await supabase
      .from("funds")
      .upsert({ isin: fundIsin, name: resolvedName }, { onConflict: "isin" });
    if (fundErr) throw new Error("Fund upsert failed: " + fundErr.message);

    const { error: linkErr2 } = await supabase
      .from("user_funds")
      .upsert({ user_id: user.id, fund_isin: fundIsin }, { onConflict: "user_id,fund_isin", ignoreDuplicates: true });
    if (linkErr2) {
      console.error("user_funds upsert failed:", linkErr2);
      return NextResponse.json({ error: "Failed to save fund to your list: " + linkErr2.message }, { status: 500 });
    }

    // ── Step 5: Resolve tickers via Finnhub and seed holdings ─────────────────
    let seeded = 0;

    for (const holding of holdings) {
      const { name, y: weight, countryCode, isin } = holding;
      if (!isin) continue;

      await sleep(350);

      const searchRes = await fetch(
        `https://finnhub.io/api/v1/search?q=${encodeURIComponent(isin)}&token=${FINNHUB_KEY}`
      );
      const search = await searchRes.json();
      const match = (search.result ?? []).find(
        (r: { type: string }) => r.type === "Common Stock" || r.type === "EQS"
      );
      if (!match) continue;

      // Normalise: spaces → dashes, then apply exchange suffix
      const ticker = formatTicker(normalizeFinnhubTicker(match.displaySymbol), countryCode);

      await sleep(350);
      let sector = "Unknown";
      try {
        const profileRes = await fetch(
          `https://finnhub.io/api/v1/stock/profile2?isin=${encodeURIComponent(isin)}&token=${FINNHUB_KEY}`
        );
        const profile = await profileRes.json();
        sector = profile.finnhubIndustry ?? "Unknown";
      } catch {
        // non-fatal
      }

      await supabase
        .from("stocks")
        .upsert({ ticker, name, country: countryCode, sector }, { onConflict: "ticker" });

      await supabase.from("fund_holdings").upsert(
        { fund_isin: fundIsin, stock_ticker: ticker, weight_percentage: weight },
        { onConflict: "fund_isin,stock_ticker", ignoreDuplicates: true }
      );

      seeded++;
    }

    return NextResponse.json({
      message: `Successfully added "${resolvedName}" with ${seeded} holdings`,
      fund: { isin: fundIsin, name: resolvedName },
      cached: false,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("Unexpected error in /api/add-fund:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
