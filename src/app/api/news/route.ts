import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { stripSuffix } from "@/lib/ticker-utils";

interface FinnhubNewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

interface BorskollensNewsItem {
  id: number;
  provider: { name: string; paywallLevel: number };
  title: string;
  description: string;
  webUrl: string;
  imageUrl: string;
  unixTimestamp: number;
}

export interface NewsItem {
  id: string;
  url: string;
  headline: string;
  summary: string;
  source: string;
  image_url: string;
  published_at: string;
  related_tickers: string[];
  category: string;
  country: string;
  sector: string;
}

/**
 * GET /api/news?fundIsin=<isin>
 *
 * Fetches news for all stocks held by a fund.
 * Uses Finnhub API with deduplication by URL.
 * Also caches results in Supabase news_articles table.
 */
export async function GET(request: NextRequest) {
  try {
    const fundIsin = request.nextUrl.searchParams.get("fundIsin");

    if (!fundIsin) {
      return NextResponse.json(
        { error: "fundIsin query parameter is required" },
        { status: 400 }
      );
    }

    // ----- Step 1: Get all stocks for this fund -----
    const { data: holdings, error: holdingsError } = await supabase
      .from("fund_holdings")
      .select("*, stocks(*)")
      .eq("fund_isin", fundIsin);

    if (holdingsError || !holdings?.length) {
      return NextResponse.json(
        { error: "No holdings found for this fund" },
        { status: 404 }
      );
    }

    // ----- Step 2: Fetch news for each stock (with deduplication) -----
    const seenUrls = new Set<string>();
    const allNews: NewsItem[] = [];
    const finnhubKey = process.env.FINNHUB_API_KEY;

    for (const holding of holdings) {
      const stock = holding.stocks;
      if (!stock) continue;

      const isSwedish = stock.country === "SE" || stock.ticker.endsWith(".ST");

      try {
        if (isSwedish) {
          // --- Börskollen for Swedish stocks ---
          const res = await fetch(
            `https://www.borskollen.se/api/v3/news/search?q=${encodeURIComponent(stock.name)}&limit=10`,
            { next: { revalidate: 300 } }
          );

          if (!res.ok) {
            console.warn(`Börskollen error for ${stock.name}: ${res.status}`);
            continue;
          }

          const data: { news: BorskollensNewsItem[] } = await res.json();

          for (const article of (data.news || []).slice(0, 5)) {
            if (seenUrls.has(article.webUrl)) {
              const existing = allNews.find((n) => n.url === article.webUrl);
              if (existing && !existing.related_tickers.includes(stock.ticker)) {
                existing.related_tickers.push(stock.ticker);
              }
              continue;
            }

            seenUrls.add(article.webUrl);

            allNews.push({
              id: `borskollen-${article.id}`,
              url: article.webUrl,
              headline: article.title,
              summary: article.description,
              source: article.provider.name,
              image_url: article.imageUrl,
              published_at: new Date(article.unixTimestamp * 1000).toISOString(),
              related_tickers: [stock.ticker],
              category: "general",
              country: stock.country || "SE",
              sector: stock.sector || "Unknown",
            });
          }
        } else {
          // --- Finnhub for non-Swedish stocks ---
          const queryTicker = stripSuffix(stock.ticker);
          const now = Math.floor(Date.now() / 1000);
          const oneWeekAgo = now - 7 * 24 * 60 * 60;

          const res = await fetch(
            `https://finnhub.io/api/v1/company-news?symbol=${queryTicker}&from=${toDateStr(oneWeekAgo)}&to=${toDateStr(now)}&token=${finnhubKey}`,
            { next: { revalidate: 300 } }
          );

          if (!res.ok) {
            console.warn(`Finnhub error for ${queryTicker}: ${res.status}`);
            continue;
          }

          const articles: FinnhubNewsItem[] = await res.json();

          for (const article of articles.slice(0, 5)) {
            if (seenUrls.has(article.url)) {
              const existing = allNews.find((n) => n.url === article.url);
              if (existing && !existing.related_tickers.includes(stock.ticker)) {
                existing.related_tickers.push(stock.ticker);
              }
              continue;
            }

            seenUrls.add(article.url);

            allNews.push({
              id: `${article.id}`,
              url: article.url,
              headline: article.headline,
              summary: article.summary,
              source: article.source,
              image_url: article.image,
              published_at: new Date(article.datetime * 1000).toISOString(),
              related_tickers: [stock.ticker],
              category: article.category || "general",
              country: stock.country || "US",
              sector: stock.sector || "Unknown",
            });
          }
        }
      } catch (fetchErr) {
        console.warn(`Failed to fetch news for ${stock.ticker}:`, fetchErr);
      }
    }

    // ----- Step 3: Sort by date, most recent first -----
    allNews.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    // ----- Step 4: Cache in Supabase news_articles (best-effort) -----
    try {
      for (const item of allNews) {
        await supabase.from("news_articles").upsert(
          {
            url: item.url,
            headline: item.headline,
            published_at: item.published_at,
            related_ticker: item.related_tickers[0] || null,
          },
          { onConflict: "url" }
        );
      }
    } catch {
      console.warn("News caching failed (non-critical)");
    }

    // ----- Build filter options from the results -----
    const countries = [...new Set(allNews.map((n) => n.country))].sort();
    const sectors = [...new Set(allNews.map((n) => n.sector))].sort();

    return NextResponse.json({
      news: allNews,
      total: allNews.length,
      filters: { countries, sectors },
    });
  } catch (err) {
    console.error("Unexpected error in /api/news:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Converts a Unix timestamp to "YYYY-MM-DD" string for Finnhub.
 */
function toDateStr(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000);
  return d.toISOString().split("T")[0];
}
