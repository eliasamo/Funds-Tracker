import { NextRequest, NextResponse } from "next/server";
import type { NewsItem } from "@/app/api/news/route";
import { supabase } from "@/lib/supabase";

type Action = "buy" | "hold" | "sell";

interface TickerFeatureRow {
  ticker: string;
  holdingWeight: number;
  newsCount7d: number;
  avgSentiment: number;
  positiveShare: number;
  negativeShare: number;
  neutralShare: number;
}

interface ScoredTickerRow extends TickerFeatureRow {
  score: number;
  action: Action;
  confidence: number;
}

interface ExternalScoringResponse {
  rows: Array<{
    ticker: string;
    score: number;
  }>;
  modelVersion?: string;
  actionThresholds?: {
    buy?: number;
    sell?: number;
  };
  confidenceScaleAbs?: number;
}

export async function GET(request: NextRequest) {
  try {
    const fundIsin = request.nextUrl.searchParams.get("fundIsin");

    if (!fundIsin) {
      return NextResponse.json(
        { error: "fundIsin query parameter is required" },
        { status: 400 }
      );
    }

    const { data: holdingsRows, error: holdingsError } = await supabase
      .from("fund_holdings")
      .select("weight_percentage, stocks(ticker)")
      .eq("fund_isin", fundIsin)
      .order("weight_percentage", { ascending: false });

    if (holdingsError) {
      return NextResponse.json(
        { error: holdingsError.message || "Failed to load holdings" },
        { status: 500 }
      );
    }

    const origin = request.nextUrl.origin;
    const news = await loadNewsBestEffort(origin, fundIsin);

    const holdingWeightByTicker = new Map<string, number>();
    for (const row of holdingsRows || []) {
      const stock = (row.stocks as unknown) as { ticker: string } | null;
      if (!stock?.ticker) continue;
      holdingWeightByTicker.set(stock.ticker, row.weight_percentage ?? 0);
    }

    const statsByTicker = new Map<
      string,
      {
        signedSum: number;
        count: number;
        positive: number;
        negative: number;
        neutral: number;
      }
    >();

    for (const article of news || []) {
      if (!article.related_tickers?.length) continue;

      const sentimentValue = toSignedSentiment(article);
      const sentimentLabel = article.sentiment?.label ?? "neutral";

      for (const ticker of article.related_tickers) {
        const existing = statsByTicker.get(ticker) ?? {
          signedSum: 0,
          count: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
        };

        existing.signedSum += sentimentValue;
        existing.count += 1;
        if (sentimentLabel === "positive") existing.positive += 1;
        else if (sentimentLabel === "negative") existing.negative += 1;
        else existing.neutral += 1;

        statsByTicker.set(ticker, existing);
      }
    }

    const featureRows: TickerFeatureRow[] = [];

    for (const [ticker, holdingWeight] of holdingWeightByTicker) {
      const s = statsByTicker.get(ticker);
      const count = s?.count ?? 0;
      const avgSentiment = count > 0 ? s!.signedSum / count : 0;

      featureRows.push({
        ticker,
        holdingWeight,
        newsCount7d: count,
        avgSentiment,
        positiveShare: count > 0 ? (s!.positive / count) : 0,
        negativeShare: count > 0 ? (s!.negative / count) : 0,
        neutralShare: count > 0 ? (s!.neutral / count) : 0,
      });
    }

    let modelMode: "heuristic_fallback" | "xgboost_external" = "heuristic_fallback";
    let modelVersion = "xgboost-v1-feature-scaffold";
    let actionThresholds = { buy: 0.2, sell: -0.2 };
    let confidenceScaleAbs = 0.35;

    const scoringUrl =
      process.env.XGBOOST_SCORING_URL || "http://127.0.0.1:8008/score";
    let scoredRows: ScoredTickerRow[];

    if (scoringUrl) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        let res: Response;
        try {
          res = await fetch(scoringUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fundIsin, rows: featureRows }),
            cache: "no-store",
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }

        if (!res.ok) throw new Error(`External scorer HTTP ${res.status}`);

        const external = (await res.json()) as ExternalScoringResponse;
        const scoreByTicker = new Map(
          (external.rows || []).map((r) => [r.ticker, r.score])
        );

        actionThresholds = {
          buy: external.actionThresholds?.buy ?? 0.02,
          sell: external.actionThresholds?.sell ?? -0.02,
        };
        confidenceScaleAbs = clamp(external.confidenceScaleAbs ?? 0.05, 0.01, 1);

        scoredRows = featureRows.map((row) => {
          const score = clamp(scoreByTicker.get(row.ticker) ?? 0, -1, 1);
          return {
            ...row,
            score,
            action: scoreToAction(score, actionThresholds),
            confidence: scoreToConfidence(score, confidenceScaleAbs),
          };
        });

        modelMode = "xgboost_external";
        modelVersion = external.modelVersion || "xgboost-external";
      } catch {
        scoredRows = scoreWithFallback(featureRows);
      }
    } else {
      scoredRows = scoreWithFallback(featureRows);
    }

    scoredRows.sort((a, b) => b.score - a.score);

    const top = scoredRows[0];
    const suggestedAction = top ? top.action : "hold";

    return NextResponse.json({
      fundIsin,
      model: {
        family: "xgboost",
        mode: modelMode,
        version: modelVersion,
      },
      suggestion: {
        action: suggestedAction,
        confidence: top ? top.confidence : 0,
        topTicker: top?.ticker || null,
      },
      rows: scoredRows,
    });
  } catch (err) {
    console.error("Unexpected error in /api/signals:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function toSignedSentiment(article: NewsItem): number {
  if (!article.sentiment) return 0;
  const score = clamp(article.sentiment.score, 0, 1);
  if (article.sentiment.label === "positive") return score;
  if (article.sentiment.label === "negative") return -score;
  return 0;
}

function scoreWithFallback(rows: TickerFeatureRow[]): ScoredTickerRow[] {
  const maxNews = Math.max(...rows.map((r) => r.newsCount7d), 1);

  return rows.map((row) => {
    const weightNorm = clamp(row.holdingWeight / 100, 0, 1);
    const newsNorm = clamp(row.newsCount7d / maxNews, 0, 1);

    // Fallback score only until an external XGBoost scorer is connected.
    const score = clamp(
      row.avgSentiment * 0.65 + weightNorm * 0.2 + newsNorm * 0.15,
      -1,
      1
    );

    return {
      ...row,
      score,
      action: scoreToAction(score, { buy: 0.2, sell: -0.2 }),
      confidence: scoreToConfidence(score, 0.35),
    };
  });
}

function scoreToAction(score: number, thresholds: { buy: number; sell: number }): Action {
  if (score >= thresholds.buy) return "buy";
  if (score <= thresholds.sell) return "sell";
  return "hold";
}

function scoreToConfidence(score: number, scaleAbs: number): number {
  return clamp(Math.abs(score) / Math.max(scaleAbs, 0.01), 0, 1);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

async function loadNewsBestEffort(origin: string, fundIsin: string): Promise<NewsItem[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(
      `${origin}/api/news?fundIsin=${encodeURIComponent(fundIsin)}`,
      {
        cache: "no-store",
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      console.warn("Signals page: /api/news returned non-OK response", res.status);
      return [];
    }

    const data = (await res.json()) as { news?: NewsItem[] };
    return data.news || [];
  } catch (err) {
    console.warn("Signals page: failed to fetch /api/news (best-effort)", err);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}