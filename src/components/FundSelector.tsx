"use client";

import { Layers, Loader2, Trash2 } from "lucide-react";

interface Fund {
  isin: string;
  name: string;
}

interface FundSentiment {
  positive: number;
  negative: number;
  neutral: number;
}

interface FundSelectorProps {
  funds: Fund[];
  selectedFundIsin: string | null;
  onSelect: (fundIsin: string) => void;
  onRemove: (fundIsin: string) => void;
  loading: boolean;
  articleCounts: Record<string, number>;
  unreadCounts: Record<string, number>;
  fundSentiments: Record<string, FundSentiment>;
}

export default function FundSelector({
  funds,
  selectedFundIsin,
  onSelect,
  onRemove,
  loading,
  articleCounts,
  unreadCounts,
  fundSentiments,
}: FundSelectorProps) {
  const sectionLabel =
    "mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]";

  if (funds.length === 0) {
    return (
      <div>
        <p className={sectionLabel}>
          <Layers className="h-3 w-3" />
          Your Funds
        </p>
        <p className="rounded-lg border border-dashed border-[var(--card-border)] p-4 text-center text-xs text-[var(--muted)]">
          No funds yet. Add one above.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className={sectionLabel}>
        <Layers className="h-3 w-3" />
        Your Funds
      </p>

      <div className="space-y-1.5">
        {funds.map((fund) => {
          const isSelected = fund.isin === selectedFundIsin;

          return (
            <div key={fund.isin} className="group/row relative">
              <button
                onClick={() => onSelect(fund.isin)}
                disabled={loading}
                className={`relative w-full rounded-lg border px-3 py-2.5 text-left transition-all disabled:cursor-wait pr-8 ${
                  isSelected
                    ? "border-[var(--accent)]/50 bg-[var(--accent)]/10"
                    : "border-[var(--card-border)] hover:border-[var(--accent)]/30 hover:bg-white/[0.03]"
                }`}
              >
                <div
                  className={`truncate text-xs font-semibold ${
                    isSelected ? "text-white" : "text-[var(--foreground)]"
                  }`}
                >
                  {fund.name}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-[var(--muted)]">{fund.isin}</span>
                  {articleCounts[fund.isin] > 0 && (
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                      unreadCounts[fund.isin] > 0
                        ? "bg-[var(--accent)]/20 text-[var(--accent)]"
                        : "bg-white/5 text-[var(--muted)]"
                    }`}>
                      {unreadCounts[fund.isin] > 0
                        ? `${unreadCounts[fund.isin]} new`
                        : `${articleCounts[fund.isin]} articles`}
                    </span>
                  )}
                </div>

                {/* Sentiment bar */}
                {fundSentiments[fund.isin] && (
                  <div className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="bg-green-500/60"
                      style={{ width: `${fundSentiments[fund.isin].positive * 100}%` }}
                    />
                    <div
                      className="bg-white/20"
                      style={{ width: `${fundSentiments[fund.isin].neutral * 100}%` }}
                    />
                    <div
                      className="bg-red-500/60"
                      style={{ width: `${fundSentiments[fund.isin].negative * 100}%` }}
                    />
                  </div>
                )}

                {/* Loading overlay */}
                {isSelected && loading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-[var(--background)]/60">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
                  </div>
                )}

                {/* Active indicator bar */}
                {isSelected && !loading && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r-full bg-[var(--accent)]" />
                )}
              </button>

              {/* Remove button — appears on row hover */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(fund.isin);
                }}
                title="Remove fund"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--muted)] opacity-0 transition-all group-hover/row:opacity-100 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
