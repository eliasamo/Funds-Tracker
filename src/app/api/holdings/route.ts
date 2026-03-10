import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const fundIsin = request.nextUrl.searchParams.get("fundIsin");

  if (!fundIsin) {
    return NextResponse.json({ error: "fundIsin is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("fund_holdings")
    .select("weight_percentage, stocks(ticker, name, country, sector)")
    .eq("fund_isin", fundIsin)
    .order("weight_percentage", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Deduplicate by stock name — keeps only the highest-weight row per company.
  // This handles stale duplicate rows from earlier seeder runs with bad tickers.
  const seenNames = new Set<string>();
  const raw = (data || [])
    .map((h) => {
      const stock = h.stocks as { ticker: string; name: string; country: string; sector: string } | null;
      return {
        ticker: stock?.ticker ?? "",
        name: stock?.name ?? "",
        country: stock?.country ?? "",
        sector: stock?.sector ?? "Unknown",
        weight: h.weight_percentage ?? 0,
      };
    })
    .filter((h) => {
      if (!h.name || seenNames.has(h.name)) return false;
      seenNames.add(h.name);
      return true;
    });

  // Normalize weights to sum to 100% in case of data anomalies
  const totalWeight = raw.reduce((sum, h) => sum + h.weight, 0);
  const factor = totalWeight > 0 ? 100 / totalWeight : 1;

  const holdings = raw.map((h) => ({
    ...h,
    weight: Math.round(h.weight * factor * 10) / 10,
  }));

  // Group by country for the summary
  const countryMap: Record<string, number> = {};
  for (const h of holdings) {
    if (h.country) {
      countryMap[h.country] = (countryMap[h.country] ?? 0) + h.weight;
    }
  }
  const countries = Object.entries(countryMap)
    .map(([code, weight]) => ({ code, weight: Math.round(weight * 10) / 10 }))
    .sort((a, b) => b.weight - a.weight);

  return NextResponse.json({ holdings, countries });
}
