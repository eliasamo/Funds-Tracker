"use client";

import { useState } from "react";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

interface AddFundPanelProps {
  onFundAdded: (fund: { isin: string; name: string }) => void;
}

export default function AddFundPanel({ onFundAdded }: AddFundPanelProps) {
  const [fundName, setFundName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleAdd = async () => {
    if (!fundName.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/add-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundName: fundName.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ type: "error", message: data.error });
        return;
      }

      setResult({
        type: "success",
        message: data.cached
          ? `"${data.fund.name}" already up to date`
          : data.message,
      });
      setFundName("");
      if (data.fund) onFundAdded(data.fund);
    } catch {
      setResult({ type: "error", message: "Network error" });
    } finally {
      setLoading(false);
    }
  };

  const sectionLabel =
    "mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]";

  return (
    <div>
      <p className={sectionLabel}>
        <Plus className="h-3 w-3" />
        Add Fund
      </p>

      <div className="flex flex-col gap-2">
        <input
          type="text"
          value={fundName}
          onChange={(e) => setFundName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="e.g. Avanza Zero…"
          disabled={loading}
          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] placeholder:text-[var(--muted)] disabled:opacity-50"
        />

        <button
          onClick={handleAdd}
          disabled={loading || !fundName.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Adding… (~30s)
            </>
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" />
              Add Fund
            </>
          )}
        </button>
      </div>

      <Link
        href="/browse"
        className="mt-2 flex items-center justify-center gap-1 text-[11px] text-[var(--muted)] transition hover:text-[var(--foreground)]"
      >
        Browse all funds
        <ArrowRight className="h-3 w-3" />
      </Link>

      {result && (
        <div
          className={`mt-2 rounded-lg px-3 py-2 text-[11px] ${
            result.type === "success"
              ? "border border-green-800/60 bg-green-950/40 text-green-400"
              : "border border-red-800/60 bg-red-950/40 text-red-400"
          }`}
        >
          {result.message}
        </div>
      )}
    </div>
  );
}
