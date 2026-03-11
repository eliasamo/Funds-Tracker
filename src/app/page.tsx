"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Newspaper, BarChart2, LogOut, User, RefreshCw } from "lucide-react";
import AddFundPanel from "@/components/AddFundPanel";
import FundSelector from "@/components/FundSelector";
import NewsFilters from "@/components/NewsFilters";
import NewsFeed from "@/components/NewsFeed";
import HoldingsView from "@/components/HoldingsView";
import { createClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Fund {
  isin: string;
  name: string;
}

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

export default function Home() {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  // --- Fund state ---
  const [funds, setFunds] = useState<Fund[]>([]);
  const [selectedFundIsin, setSelectedFundIsin] = useState<string | null>(null);

  // --- View tab ---
  const [view, setView] = useState<"news" | "holdings">("news");

  // --- News state ---
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // --- Article counts per fund (total) and read tracking ---
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // --- Holdings state ---
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [holdingCountries, setHoldingCountries] = useState<CountrySummary[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);

  // --- Filter state ---
  const [countries, setCountries] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedSector, setSelectedSector] = useState("");

  // --- Load funds on mount ---
  const loadFunds = useCallback(async () => {
    try {
      const res = await fetch("/api/funds");
      const data = await res.json();
      setFunds(data.funds || []);
    } catch (err) {
      console.error("Failed to load funds:", err);
    }
  }, []);

  const handleFundAdded = useCallback((fund: { isin: string; name: string }) => {
    setFunds((prev) => {
      if (prev.some((f) => f.isin === fund.isin)) return prev;
      return [...prev, fund];
    });
  }, []);

  useEffect(() => {
    loadFunds();
  }, [loadFunds]);

  // --- Load news ---
  const loadNews = useCallback(async (fundIsin: string) => {
    setNewsLoading(true);
    setNews([]);
    setCountries([]);
    setSectors([]);

    try {
      const res = await fetch(`/api/news?fundIsin=${fundIsin}`);
      const data = await res.json();

      if (data.news) {
        setNews(data.news);
        setCountries(data.filters?.countries || []);
        setSectors(data.filters?.sectors || []);
        setArticleCounts((prev) => ({ ...prev, [fundIsin]: data.news.length }));
      }
    } catch (err) {
      console.error("Failed to load news:", err);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  // --- Load holdings ---
  const loadHoldings = useCallback(async (fundIsin: string) => {
    setHoldingsLoading(true);
    setHoldings([]);
    setHoldingCountries([]);

    try {
      const res = await fetch(`/api/holdings?fundIsin=${fundIsin}`);
      const data = await res.json();
      setHoldings(data.holdings || []);
      setHoldingCountries(data.countries || []);
    } catch (err) {
      console.error("Failed to load holdings:", err);
    } finally {
      setHoldingsLoading(false);
    }
  }, []);

  const handleFundRemove = useCallback(async (fundIsin: string) => {
    await fetch(`/api/funds?isin=${encodeURIComponent(fundIsin)}`, { method: "DELETE" });
    setFunds((prev) => prev.filter((f) => f.isin !== fundIsin));
    if (selectedFundIsin === fundIsin) {
      setSelectedFundIsin(null);
      setNews([]);
      setHoldings([]);
    }
  }, [selectedFundIsin]);

  const handleFundSelect = (fundIsin: string) => {
    setSelectedFundIsin(fundIsin);
    setSelectedCountry("");
    setSelectedSector("");
    setView("news");
    loadNews(fundIsin);
    loadHoldings(fundIsin);
  };

  // --- Filter news ---
  const filteredNews = news.filter((item) => {
    if (selectedCountry && item.country !== selectedCountry) return false;
    if (selectedSector && item.sector !== selectedSector) return false;
    return true;
  });

  const hasContent = selectedFundIsin !== null;
  const hasNews = news.length > 0 || newsLoading;

  return (
    <div className="flex h-full overflow-hidden bg-[var(--background)]">
      {/* ── Sidebar ────────────────────────────────────────────── */}
      <aside className="flex w-72 flex-shrink-0 flex-col overflow-y-auto border-r border-[var(--card-border)] bg-[var(--sidebar-bg)]">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30">
            <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--foreground)]">
              Fund Tracker
            </h1>
            <p className="text-[10px] text-[var(--muted)]">Your trusty fund tracker</p>
          </div>
        </div>

        {/* Add Fund section */}
        <div className="border-b border-[var(--card-border)] p-4">
          <AddFundPanel onFundAdded={handleFundAdded} />
        </div>

        {/* Your Funds section */}
        <div className="flex-1 p-4">
          <FundSelector
            funds={funds}
            selectedFundIsin={selectedFundIsin}
            onSelect={handleFundSelect}
            onRemove={handleFundRemove}
            loading={newsLoading}
            articleCounts={articleCounts}
            unreadCounts={Object.fromEntries(
              Object.entries(articleCounts).map(([isin, total]) => [
                isin,
                isin === selectedFundIsin
                  ? news.filter((n) => !readIds.has(n.id)).length
                  : total,
              ])
            )}
          />
        </div>

        {/* Sidebar footer */}
        <div className="border-t border-[var(--card-border)] px-5 py-3 flex items-center justify-between">
          <Link
            href="/profile"
            className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <User className="h-3 w-3" />
            Profile
          </Link>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="flex items-center gap-1 text-[10px] text-[var(--muted)] hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Tab bar — only when a fund is selected */}
        {hasContent && (
          <div className="flex flex-shrink-0 items-center gap-1 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] px-6 py-0">
            <button
              onClick={() => setView("news")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors ${
                view === "news"
                  ? "border-[var(--accent)] text-white"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Newspaper className="h-3.5 w-3.5" />
              News
            </button>
            <button
              onClick={() => setView("holdings")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-xs font-medium transition-colors ${
                view === "holdings"
                  ? "border-[var(--accent)] text-white"
                  : "border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              Holdings
            </button>

            {/* Refresh button */}
            <button
              onClick={() => selectedFundIsin && loadNews(selectedFundIsin)}
              disabled={newsLoading}
              title="Refresh news"
              className="ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-40"
            >
              <RefreshCw className={`h-3 w-3 ${newsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        )}

        {/* News filter bar */}
        {view === "news" && hasNews && (
          <div className="flex-shrink-0 border-b border-[var(--card-border)] bg-[var(--sidebar-bg)] px-6 py-3">
            <NewsFilters
              countries={countries}
              sectors={sectors}
              selectedCountry={selectedCountry}
              selectedSector={selectedSector}
              onCountryChange={setSelectedCountry}
              onSectorChange={setSelectedSector}
              totalResults={news.length}
              filteredResults={filteredNews.length}
            />
          </div>
        )}

        {/* Scrollable content area */}
        <main className="flex-1 overflow-y-auto px-6 py-6">
          {/* Empty state */}
          {!selectedFundIsin && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--card-bg)] ring-1 ring-[var(--card-border)]">
                <Newspaper className="h-6 w-6 text-[var(--muted)]" />
              </div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                No fund selected
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Pick a fund from the sidebar to load its news feed.
              </p>
            </div>
          )}

          {/* News view */}
          {selectedFundIsin && view === "news" && (
            <NewsFeed
              news={filteredNews}
              loading={newsLoading}
              onReadChange={setReadIds}
            />
          )}

          {/* Holdings view */}
          {selectedFundIsin && view === "holdings" && (
            <HoldingsView
              holdings={holdings}
              countries={holdingCountries}
              loading={holdingsLoading}
            />
          )}
        </main>
      </div>
    </div>
  );
}
