"use client";

import { stripSuffix } from "@/lib/ticker-utils";

interface NewsItem {
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

interface NewsFeedProps {
  news: NewsItem[];
  loading: boolean;
}

export default function NewsFeed({ news, loading }: NewsFeedProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl border border-zinc-800 bg-[var(--card-bg)] p-5"
          >
            <div className="flex gap-4">
              <div className="h-20 w-32 flex-shrink-0 rounded-lg bg-white/5" />
              <div className="flex-1 space-y-2.5">
                <div className="h-4 w-3/4 rounded bg-white/5" />
                <div className="h-3 w-full rounded bg-white/5" />
                <div className="h-3 w-2/3 rounded bg-white/5" />
                <div className="mt-3 flex gap-2">
                  <div className="h-5 w-12 rounded-md bg-white/5" />
                  <div className="h-5 w-10 rounded-md bg-white/5" />
                  <div className="h-5 w-16 rounded-md bg-white/5" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] flex-col items-center justify-center rounded-xl border border-zinc-800 bg-[var(--card-bg)] p-12 text-center">
        <svg
          className="mx-auto mb-4 h-10 w-10 text-[var(--muted)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
          />
        </svg>
        <p className="text-sm font-medium text-[var(--foreground)]">
          No articles match the current filters
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Try adjusting the country or sector filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {news.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-xl border border-zinc-800 bg-[var(--card-bg)] p-5 transition-all hover:border-zinc-700 hover:bg-white/[0.02]"
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            {item.image_url && (
              <div className="hidden flex-shrink-0 sm:block">
                <img
                  src={item.image_url}
                  alt=""
                  className="h-24 w-36 rounded-lg object-cover opacity-90 transition group-hover:opacity-100"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            {/* Body */}
            <div className="min-w-0 flex-1">
              {/* Headline */}
              <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug tracking-tight text-[var(--foreground)] transition group-hover:text-[var(--accent)]">
                {item.headline}
              </h3>

              {/* Summary */}
              <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">
                {item.summary}
              </p>

              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Ticker badges */}
                {item.related_tickers.map((ticker) => (
                  <span
                    key={ticker}
                    className="rounded-md border border-[var(--accent)]/20 bg-[var(--accent)]/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--accent)]"
                  >
                    {stripSuffix(ticker)}
                  </span>
                ))}

                {/* Country flag badge */}
                {item.country && (
                  <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                    {countryFlag(item.country)}{" "}
                    <span className="font-medium">{item.country}</span>
                  </span>
                )}

                {/* Sector badge */}
                {item.sector && (
                  <span className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-[var(--muted)]">
                    {item.sector}
                  </span>
                )}

                {/* Source · date */}
                <span className="ml-auto text-[10px] text-[var(--muted)]/70">
                  {item.source} &middot; {formatDate(item.published_at)}
                </span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function formatDate(isoStr: string): string {
  const date = new Date(isoStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("sv-SE");
}

function countryFlag(code: string): string {
  const flags: Record<string, string> = {
    SE: "🇸🇪",
    US: "🇺🇸",
    DK: "🇩🇰",
    FI: "🇫🇮",
    NO: "🇳🇴",
    DE: "🇩🇪",
    UK: "🇬🇧",
    CH: "🇨🇭",
    NL: "🇳🇱",
  };
  return flags[code] || "🌍";
}
