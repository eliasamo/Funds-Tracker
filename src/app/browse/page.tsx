"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Loader2, ChevronLeft, Check, TrendingUp } from "lucide-react";
import Link from "next/link";

interface FundItem {
  name: string;
  isin: string;
}

export default function BrowsePage() {
  const [query, setQuery] = useState("");
  const [funds, setFunds] = useState<FundItem[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [addingIsin, setAddingIsin] = useState<string | null>(null);
  const [addedIsins, setAddedIsins] = useState<Set<string>>(new Set());
  const [addErrors, setAddErrors] = useState<Record<string, string>>({});

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Keep latest query/page in refs so the observer callback is always fresh
  const queryRef = useRef(query);
  const pageRef = useRef(page);
  const hasMoreRef = useRef(hasMore);
  queryRef.current = query;
  pageRef.current = page;
  hasMoreRef.current = hasMore;

  const fetchFunds = useCallback(async (q: string, p: number, append: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    if (!append) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await fetch(
        `/api/browse-funds?q=${encodeURIComponent(q)}&page=${p}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setFunds((prev) => (append ? [...prev, ...data.funds] : data.funds));
      setHasMore(data.hasMore);
      hasMoreRef.current = data.hasMore;
      setPage(p);
      pageRef.current = p;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFunds("", 0, false);
  }, [fetchFunds]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMoreRef.current &&
          !fetchingRef.current
        ) {
          fetchFunds(queryRef.current, pageRef.current + 1, true);
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchFunds, loading]);

  const handleSearch = (q: string) => {
    setQuery(q);
    queryRef.current = q;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchFunds(q, 0, false);
    }, 400);
  };

  const handleAdd = async (fund: FundItem) => {
    setAddingIsin(fund.isin);
    setAddErrors((prev) => {
      const next = { ...prev };
      delete next[fund.isin];
      return next;
    });

    try {
      const res = await fetch("/api/add-fund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fundName: fund.name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAddErrors((prev) => ({ ...prev, [fund.isin]: data.error }));
      } else {
        setAddedIsins((prev) => new Set([...prev, fund.isin]));
      }
    } catch {
      setAddErrors((prev) => ({ ...prev, [fund.isin]: "Network error" }));
    } finally {
      setAddingIsin(null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* ── Sticky header ───────────────────────────────────────── */}
      <div className="sticky top-0 z-10 border-b border-[var(--card-border)] bg-[var(--background)]/95 px-6 py-4 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1 text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Back
            </Link>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span className="text-sm font-semibold text-[var(--foreground)]">
                Browse Funds
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2.5 transition focus-within:border-[var(--accent)]">
            <Search className="h-3.5 w-3.5 flex-shrink-0 text-[var(--muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by fund name…"
              className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              autoFocus
            />
            {loading && (
              <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin text-[var(--muted)]" />
            )}
          </div>
        </div>
      </div>

      {/* ── Fund list ────────────────────────────────────────────── */}
      <div className="mx-auto max-w-2xl px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--muted)]" />
          </div>
        ) : funds.length === 0 ? (
          <p className="py-20 text-center text-sm text-[var(--muted)]">
            No funds found{query ? ` for "${query}"` : ""}.
          </p>
        ) : (
          <>
            <p className="mb-3 text-[11px] text-[var(--muted)]">
              {funds.length} fund{funds.length !== 1 ? "s" : ""}
              {query ? ` matching "${query}"` : ""}
            </p>

            <div className="space-y-1.5">
              {funds.map((fund) => {
                const isAdding = addingIsin === fund.isin;
                const isAdded = addedIsins.has(fund.isin);
                const error = addErrors[fund.isin];

                return (
                  <div
                    key={fund.isin}
                    className="flex items-center gap-3 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 transition hover:border-[var(--accent)]/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--foreground)]">
                        {fund.name}
                      </p>
                      {error && (
                        <p className="mt-0.5 text-[11px] text-red-400">{error}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAdd(fund)}
                      disabled={isAdding || isAdded}
                      className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed ${
                        isAdded
                          ? "border border-green-800/50 bg-green-950/30 text-green-400"
                          : "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                      }`}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check className="h-3 w-3" />
                          Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3" />
                          Add
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sentinel + bottom loader */}
            <div ref={sentinelRef} className="py-4 flex justify-center">
              {loadingMore && (
                <Loader2 className="h-4 w-4 animate-spin text-[var(--muted)]" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
