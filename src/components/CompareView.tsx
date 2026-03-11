"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface Holding {
  ticker: string;
  name: string;
  country: string;
  sector: string;
  weight: number;
}

interface Fund {
  isin: string;
  name: string;
}

interface CompareViewProps {
  funds: Fund[];
  primaryIsin: string;
}

async function fetchHoldings(isin: string): Promise<Holding[]> {
  const res = await fetch(`/api/holdings?fundIsin=${isin}`);
  const data = await res.json();
  return data.holdings || [];
}

export default function CompareView({ funds, primaryIsin }: CompareViewProps) {
  const [compareIsin, setCompareIsin] = useState<string>("");
  const [primaryHoldings, setPrimaryHoldings] = useState<Holding[]>([]);
  const [compareHoldings, setCompareHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(false);

  const primaryFund = funds.find((f) => f.isin === primaryIsin);
  const compareFund = funds.find((f) => f.isin === compareIsin);

  // Load primary fund holdings
  useEffect(() => {
    if (!primaryIsin) return;
    fetchHoldings(primaryIsin).then(setPrimaryHoldings);
  }, [primaryIsin]);

  // Load compare fund holdings
  useEffect(() => {
    if (!compareIsin) { setCompareHoldings([]); return; }
    setLoading(true);
    fetchHoldings(compareIsin).then((h) => { setCompareHoldings(h); setLoading(false); });
  }, [compareIsin]);

  // Build sets of tickers for overlap detection
  const primaryTickers = new Set(primaryHoldings.map((h) => h.ticker));
  const compareTickers = new Set(compareHoldings.map((h) => h.ticker));

  const overlap = primaryHoldings.filter((h) => compareTickers.has(h.ticker));
  const onlyInPrimary = primaryHoldings.filter((h) => !compareTickers.has(h.ticker));
  const onlyInCompare = compareHoldings.filter((h) => !primaryTickers.has(h.ticker));

  const otherFunds = funds.filter((f) => f.isin !== primaryIsin);

  return (
    <div className="space-y-6">
      {/* Fund picker */}
      <div className="flex items-center gap-4 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-5 py-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--muted)] mb-1">Comparing</p>
          <p className="text-sm font-semibold text-[var(--accent)] truncate">{primaryFund?.name}</p>
        </div>
        <span className="text-[var(--muted)] text-xs font-bold">VS</span>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-[var(--muted)] mb-1">Against</p>
          {otherFunds.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">Add another fund to compare</p>
          ) : (
            <select
              value={compareIsin}
              onChange={(e) => setCompareIsin(e.target.value)}
              className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-2.5 py-1.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              <option value="">Select a fund…</option>
              {otherFunds.map((f) => (
                <option key={f.isin} value={f.isin}>{f.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!compareIsin && (
        <p className="py-12 text-center text-sm text-[var(--muted)]">
          Select a second fund above to compare holdings.
        </p>
      )}

      {compareIsin && loading && (
        <div className="flex h-40 items-center justify-center gap-2 text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {compareIsin && !loading && compareHoldings.length > 0 && (
        <>
          {/* Overlap stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Shared holdings", value: overlap.length, color: "text-[var(--accent)]" },
              { label: `Only in ${primaryFund?.name.split(" ")[0]}`, value: onlyInPrimary.length, color: "text-emerald-400" },
              { label: `Only in ${compareFund?.name.split(" ")[0]}`, value: onlyInCompare.length, color: "text-purple-400" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Side-by-side table */}
          <div className="grid grid-cols-2 gap-4">
            {/* Left column — primary */}
            <HoldingColumn
              title={primaryFund?.name ?? ""}
              holdings={primaryHoldings}
              highlightTickers={compareTickers}
              accentColor="emerald"
            />
            {/* Right column — compare */}
            <HoldingColumn
              title={compareFund?.name ?? ""}
              holdings={compareHoldings}
              highlightTickers={primaryTickers}
              accentColor="purple"
            />
          </div>
        </>
      )}
    </div>
  );
}

function HoldingColumn({
  title,
  holdings,
  highlightTickers,
  accentColor,
}: {
  title: string;
  holdings: Holding[];
  highlightTickers: Set<string>;
  accentColor: "emerald" | "purple";
}) {
  const maxWeight = holdings[0]?.weight ?? 1;
  const colorClass = accentColor === "emerald" ? "bg-emerald-400/40" : "bg-purple-400/40";
  const sharedClass = accentColor === "emerald" ? "bg-[var(--accent)]/40" : "bg-[var(--accent)]/40";

  return (
    <div className="rounded-xl border border-[var(--card-border)] overflow-hidden">
      <div className="bg-[var(--sidebar-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] truncate border-b border-[var(--card-border)]">
        {title}
      </div>
      <div className="divide-y divide-[var(--card-border)] bg-[var(--card-bg)]">
        {holdings.slice(0, 20).map((h) => {
          const isShared = highlightTickers.has(h.ticker);
          return (
            <div key={h.ticker} className={`flex items-center gap-2 px-3 py-2 ${isShared ? "bg-[var(--accent)]/5" : ""}`}>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-medium text-[var(--foreground)]">{h.name}</p>
                <p className="font-mono text-[9px] text-[var(--muted)]">{h.ticker}</p>
              </div>
              <div className="flex flex-col items-end gap-1 w-16 flex-shrink-0">
                <span className="font-mono text-[10px] text-[var(--foreground)]">{h.weight.toFixed(1)}%</span>
                <div className="w-full h-1 rounded-full bg-white/[0.06]">
                  <div
                    className={`h-full rounded-full ${isShared ? sharedClass : colorClass}`}
                    style={{ width: `${(h.weight / maxWeight) * 100}%` }}
                  />
                </div>
              </div>
              {isShared && (
                <span title="Shared holding" className="text-[var(--accent)] text-[10px] flex-shrink-0">⟷</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
