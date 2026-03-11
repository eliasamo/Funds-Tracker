"use client";

import { Loader2 } from "lucide-react";

interface Holding {
  ticker: string;
  name: string;
  country: string;
  sector: string;
  weight: number;
}

interface CountrySummary {
  code: string;
  weight: number;
}

interface HoldingsViewProps {
  holdings: Holding[];
  countries: CountrySummary[];
  loading: boolean;
}

function FlagImg({ code }: { code: string }) {
  if (!code || code.length !== 2) return <span className="text-[var(--muted)]">?</span>;
  return (
    <img
      src={`https://flagcdn.com/16x12/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/32x24/${code.toLowerCase()}.png 2x`}
      width={16}
      height={12}
      alt={code}
      className="rounded-[2px]"
    />
  );
}

const COUNTRY_NAMES: Record<string, string> = {
  SE: "Sweden",    US: "United States", FI: "Finland",      DK: "Denmark",
  NO: "Norway",    DE: "Germany",       GB: "United Kingdom", UK: "United Kingdom",
  NL: "Netherlands", FR: "France",      CH: "Switzerland",  IT: "Italy",
  ES: "Spain",     JP: "Japan",         CN: "China",        KR: "South Korea",
  CA: "Canada",    AU: "Australia",     HK: "Hong Kong",    IL: "Israel",
  MX: "Mexico",    BR: "Brazil",        IN: "India",        SG: "Singapore",
  TW: "Taiwan",    PL: "Poland",        AT: "Austria",      BE: "Belgium",
};

export default function HoldingsView({ holdings, countries, loading }: HoldingsViewProps) {
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-[var(--muted)]">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading holdings…</span>
      </div>
    );
  }

  if (!holdings.length) {
    return (
      <p className="py-12 text-center text-sm text-[var(--muted)]">
        No holdings found for this fund.
      </p>
    );
  }

  const maxWeight = holdings[0]?.weight ?? 1;
  const top10 = holdings.slice(0, 10);

  return (
    <div className="space-y-6">

      {/* ── Top 10 bar chart ───────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          Top 10 Holdings
        </p>
        <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 py-4 space-y-2.5">
          {top10.map((h) => (
            <div key={h.ticker} className="flex items-center gap-3">
              {/* Label */}
              <div className="w-32 flex-shrink-0 min-w-0">
                <p className="truncate text-[11px] font-medium text-[var(--foreground)]">{h.name}</p>
                <p className="font-mono text-[9px] text-[var(--accent)]">{h.ticker}</p>
              </div>
              {/* Bar */}
              <div className="relative flex-1 h-5 rounded-md overflow-hidden bg-white/[0.04]">
                <div
                  className="h-full rounded-md bg-[var(--accent)]/50 transition-all duration-500"
                  style={{ width: `${(h.weight / maxWeight) * 100}%` }}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[var(--foreground)]">
                  {h.weight.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {countries.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            Country Exposure
          </p>
          <div className="flex flex-wrap gap-2">
            {countries.map((c) => (
              <div
                key={c.code}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-1.5"
              >
                <FlagImg code={c.code} />
                <span className="text-xs font-medium text-[var(--foreground)]">
                  {COUNTRY_NAMES[c.code] ?? c.code}
                </span>
                <span className="text-[10px] text-[var(--muted)]">{c.weight}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Holdings table ─────────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
          {holdings.length} Holdings
        </p>

        <div className="overflow-hidden rounded-xl border border-[var(--card-border)]">
          {/* Table header */}
          <div className="grid grid-cols-[1fr_auto_auto_auto_120px] gap-4 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            <span>Company</span>
            <span>Country</span>
            <span>Sector</span>
            <span className="text-right">Weight</span>
            <span></span>
          </div>

          {/* Rows */}
          <div className="divide-y divide-[var(--card-border)]">
            {holdings.map((h) => (
              <div
                key={h.ticker}
                className="grid grid-cols-[1fr_auto_auto_auto_120px] items-center gap-4 bg-[var(--card-bg)] px-4 py-3 text-sm transition-colors hover:bg-white/[0.02]"
              >
                {/* Company */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--foreground)]">{h.name}</p>
                  <p className="font-mono text-[10px] text-[var(--accent)]">{h.ticker}</p>
                </div>

                {/* Country */}
                <div className="flex items-center gap-1.5 whitespace-nowrap">
                  <FlagImg code={h.country} />
                  <span className="text-xs text-[var(--muted)]">{h.country}</span>
                </div>

                {/* Sector */}
                <span className="whitespace-nowrap rounded-md border border-[var(--card-border)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
                  {h.sector === "Unknown" ? "—" : h.sector}
                </span>

                {/* Weight number */}
                <span className="whitespace-nowrap text-right font-mono text-xs text-[var(--foreground)]">
                  {h.weight.toFixed(1)}%
                </span>

                {/* Weight bar */}
                <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]/60"
                    style={{ width: `${(h.weight / maxWeight) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
