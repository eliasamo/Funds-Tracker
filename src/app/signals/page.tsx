"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Loader2, BrainCircuit } from "lucide-react";

interface Fund {
  isin: string;
  name: string;
}

interface SignalRow {
  ticker: string;
  holdingWeight: number;
  newsCount7d: number;
  avgSentiment: number;
  positiveShare: number;
  negativeShare: number;
  neutralShare: number;
  score: number;
  action: "buy" | "hold" | "sell";
  confidence: number;
}

interface SignalsResponse {
  fundIsin: string;
  model: {
    family: "xgboost";
    mode: "heuristic_fallback" | "xgboost_external";
    version: string;
  };
  suggestion: {
    action: "buy" | "hold" | "sell";
    confidence: number;
    topTicker: string | null;
  };
  rows: SignalRow[];
}

export default function SignalsPage() {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFundIsin, setSelectedFundIsin] = useState("");
  const [loadingFunds, setLoadingFunds] = useState(true);
  const [loadingSignals, setLoadingSignals] = useState(false);
  const [error, setError] = useState("");
  const [signals, setSignals] = useState<SignalsResponse | null>(null);

  useEffect(() => {
    const loadFunds = async () => {
      setLoadingFunds(true);
      try {
        const res = await fetch("/api/funds");
        const data = await res.json();
        const nextFunds: Fund[] = data.funds || [];
        setFunds(nextFunds);
        if (nextFunds.length > 0) {
          setSelectedFundIsin(nextFunds[0].isin);
        }
      } catch {
        setError("Failed to load funds.");
      } finally {
        setLoadingFunds(false);
      }
    };

    loadFunds();
  }, []);

  const selectedFund = useMemo(
    () => funds.find((f) => f.isin === selectedFundIsin) || null,
    [funds, selectedFundIsin]
  );

  const loadSignals = async () => {
    if (!selectedFundIsin) return;
    setError("");
    setLoadingSignals(true);

    try {
      const res = await fetch(
        `/api/signals?fundIsin=${encodeURIComponent(selectedFundIsin)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load signals.");
        setSignals(null);
        return;
      }
      setSignals(data);
    } catch {
      setError("Failed to load signals.");
      setSignals(null);
    } finally {
      setLoadingSignals(false);
    }
  };

  useEffect(() => {
    if (selectedFundIsin) {
      loadSignals();
    }
  }, [selectedFundIsin]);

  return (
    <div className="min-h-screen bg-[var(--background)] px-6 py-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--card-border)] px-2.5 py-1.5 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Dashboard
            </Link>
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-4 w-4 text-[var(--accent)]" />
              <h1 className="text-sm font-semibold text-[var(--foreground)]">
                XGBoost Signals Lab
              </h1>
            </div>
          </div>

          <button
            onClick={loadSignals}
            disabled={loadingSignals || !selectedFundIsin}
            className="inline-flex items-center gap-2 rounded-md border border-[var(--card-border)] px-3 py-1.5 text-xs text-[var(--foreground)] transition hover:border-[var(--accent)]/40 disabled:opacity-50"
          >
            {loadingSignals ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Activity className="h-3.5 w-3.5" />
            )}
            Refresh
          </button>
        </div>

        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4">
          <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Fund
          </label>
          {loadingFunds ? (
            <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading funds...
            </div>
          ) : funds.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">
              No funds found. Add a fund first from the dashboard.
            </p>
          ) : (
            <select
              value={selectedFundIsin}
              onChange={(e) => setSelectedFundIsin(e.target.value)}
              className="w-full max-w-lg rounded-md border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              {funds.map((fund) => (
                <option key={fund.isin} value={fund.isin}>
                  {fund.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {error && (
          <div className="rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {signals && (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <InfoCard
                title="Selected Fund"
                value={selectedFund?.name || signals.fundIsin}
                sub={signals.fundIsin}
              />
              <InfoCard
                title="Model"
                value={`${signals.model.family} (${signals.model.mode})`}
                sub={signals.model.version}
              />
              <InfoCard
                title="Suggestion"
                value={signals.suggestion.action.toUpperCase()}
                sub={`confidence ${(signals.suggestion.confidence * 100).toFixed(0)}%${
                  signals.suggestion.topTicker ? ` · ${signals.suggestion.topTicker}` : ""
                }`}
              />
            </div>

            <div className="overflow-hidden rounded-lg border border-[var(--card-border)]">
              <div className="grid grid-cols-[120px_90px_90px_90px_110px_90px] gap-3 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                <span>Ticker</span>
                <span className="text-right">Weight</span>
                <span className="text-right">News 7d</span>
                <span className="text-right">Sent</span>
                <span className="text-right">Score</span>
                <span className="text-right">Action</span>
              </div>

              <div className="divide-y divide-[var(--card-border)] bg-[var(--card-bg)]">
                {signals.rows.length === 0 && (
                  <div className="px-3 py-5 text-xs text-[var(--muted)]">
                    No rows available for this fund.
                  </div>
                )}

                {signals.rows.map((row) => (
                  <div
                    key={row.ticker}
                    className="grid grid-cols-[120px_90px_90px_90px_110px_90px] gap-3 px-3 py-2.5 text-xs"
                  >
                    <span className="font-mono text-[var(--foreground)]">{row.ticker}</span>
                    <span className="text-right text-[var(--muted)]">{row.holdingWeight.toFixed(1)}%</span>
                    <span className="text-right text-[var(--muted)]">{row.newsCount7d}</span>
                    <span className="text-right text-[var(--muted)]">{row.avgSentiment.toFixed(3)}</span>
                    <span className="text-right text-[var(--foreground)]">{row.score.toFixed(3)}</span>
                    <span className="text-right">
                      <ActionBadge action={row.action} />
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
        {title}
      </p>
      <p className="mt-1 truncate text-sm font-semibold text-[var(--foreground)]">{value}</p>
      <p className="mt-1 truncate text-[11px] text-[var(--muted)]">{sub}</p>
    </div>
  );
}

function ActionBadge({ action }: { action: "buy" | "hold" | "sell" }) {
  if (action === "buy") {
    return (
      <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-1.5 py-0.5 font-semibold text-emerald-300">
        BUY
      </span>
    );
  }

  if (action === "sell") {
    return (
      <span className="rounded border border-red-500/40 bg-red-500/15 px-1.5 py-0.5 font-semibold text-red-300">
        SELL
      </span>
    );
  }

  return (
    <span className="rounded border border-white/20 bg-white/5 px-1.5 py-0.5 font-semibold text-[var(--muted)]">
      HOLD
    </span>
  );
}