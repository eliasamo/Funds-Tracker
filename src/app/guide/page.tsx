"use client";

import { TrendingUp, Search, Plus, Newspaper, BarChart2, ChevronDown, ArrowRight } from "lucide-react";
import Link from "next/link";

/* ── Mockup: Sidebar with search bar & add button ──────────── */
function MockSearchBar() {
  return (
    <div className="relative mx-auto w-full max-w-xs">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--sidebar-bg)] p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)]/15">
            <TrendingUp className="h-3 w-3 text-[var(--accent)]" />
          </div>
          <span className="text-[10px] font-bold text-[var(--foreground)]">Fund Tracker</span>
        </div>

        {/* Search bar highlight */}
        <div className="relative mb-2">
          <div className="absolute -inset-1.5 animate-pulse rounded-xl border-2 border-[var(--accent)] opacity-60" />
          <div className="relative flex items-center gap-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2">
            <Search className="h-3 w-3 text-[var(--muted)]" />
            <span className="text-[10px] text-[var(--muted)]">Search by fund name…</span>
          </div>
          <div className="absolute -right-20 top-1/2 -translate-y-1/2">
            <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">1. Search here</span>
          </div>
        </div>

        {/* Add button highlight */}
        <div className="relative">
          <div className="absolute -inset-1.5 animate-pulse rounded-xl border-2 border-emerald-400 opacity-60" />
          <div className="relative flex items-center justify-center gap-1 rounded-lg bg-[var(--accent)] py-1.5">
            <Plus className="h-3 w-3 text-white" />
            <span className="text-[10px] font-medium text-white">Add Fund</span>
          </div>
          <div className="absolute -right-20 top-1/2 -translate-y-1/2">
            <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[9px] font-bold text-black whitespace-nowrap">2. Click add</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup: Fund list with News/Holdings tabs ────────────── */
function MockFundList() {
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--sidebar-bg)] shadow-2xl overflow-hidden">
        {/* Funds list */}
        <div className="p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">Your Funds</p>
          <div className="relative mb-1">
            <div className="absolute -inset-1 animate-pulse rounded-lg border-2 border-[var(--accent)] opacity-60" />
            <div className="relative flex items-center gap-2 rounded-lg bg-[var(--accent)]/10 px-3 py-2">
              <div className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              <span className="text-[10px] text-[var(--foreground)]">Avanza Global Fund</span>
            </div>
            <div className="absolute -right-28 top-1/2 -translate-y-1/2">
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-[9px] font-bold text-white whitespace-nowrap">Your added funds</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="h-2 w-2 rounded-full bg-[var(--card-border)]" />
            <span className="text-[10px] text-[var(--muted)]">Technology Select Fund</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex border-t border-[var(--card-border)] bg-[var(--background)]">
          <div className="relative flex-1">
            <div className="absolute -inset-0.5 animate-pulse rounded-lg border-2 border-amber-400 opacity-60" />
            <div className="relative flex items-center justify-center gap-1 border-b-2 border-[var(--accent)] py-2.5">
              <Newspaper className="h-3 w-3 text-white" />
              <span className="text-[10px] font-medium text-white">News</span>
            </div>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-bold text-black whitespace-nowrap">View news</span>
            </div>
          </div>
          <div className="relative flex-1">
            <div className="absolute -inset-0.5 animate-pulse rounded-lg border-2 border-purple-400 opacity-60" />
            <div className="relative flex items-center justify-center gap-1 py-2.5">
              <BarChart2 className="h-3 w-3 text-[var(--muted)]" />
              <span className="text-[10px] text-[var(--muted)]">Holdings</span>
            </div>
            <div className="absolute -bottom-7 left-1/2 -translate-x-1/2">
              <span className="rounded-full bg-purple-400 px-2 py-0.5 text-[9px] font-bold text-black whitespace-nowrap">View holdings</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Mockup: News feed cards ──────────────────────────────── */
function MockNewsFeed() {
  const articles = [
    { headline: "Apple reports record Q4 earnings", source: "Reuters", time: "2h ago", ticker: "AAPL" },
    { headline: "Microsoft Azure growth beats expectations", source: "Bloomberg", time: "4h ago", ticker: "MSFT" },
    { headline: "Tesla unveils new battery technology", source: "CNBC", time: "6h ago", ticker: "TSLA" },
  ];

  return (
    <div className="mx-auto w-full max-w-sm space-y-2">
      {articles.map((a, i) => (
        <div
          key={i}
          className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-lg transition hover:border-[var(--accent)]/30"
        >
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded bg-[var(--accent)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--accent)]">{a.ticker}</span>
            <span className="text-[9px] text-[var(--muted)]">{a.source} · {a.time}</span>
          </div>
          <p className="text-[11px] font-medium text-[var(--foreground)]">{a.headline}</p>
        </div>
      ))}
    </div>
  );
}

/* ── Scroll indicator ─────────────────────────────────────── */
function ScrollHint() {
  return (
    <div className="flex flex-col items-center gap-1 animate-bounce">
      <span className="text-[10px] text-[var(--muted)]">Scroll down</span>
      <ChevronDown className="h-4 w-4 text-[var(--muted)]" />
    </div>
  );
}

/* ── Step number badge ────────────────────────────────────── */
function StepBadge({ step }: { step: number }) {
  return (
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30">
      <span className="text-sm font-bold text-[var(--accent)]">{step}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Guide Page
   ══════════════════════════════════════════════════════════════ */
export default function GuidePage() {
  return (
    <div className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth bg-[var(--background)]">

      {/* ── Section 1: Welcome ───────────────────────────────── */}
      <section className="relative flex min-h-screen snap-start flex-col items-center justify-center px-6 text-center">
        {/* Glow effect */}
        <div className="pointer-events-none absolute top-1/3 h-64 w-64 rounded-full bg-[var(--accent)]/5 blur-[120px]" />

        <div className="relative">
          <div className="mb-6 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--accent)]/15 ring-1 ring-[var(--accent)]/30">
              <TrendingUp className="h-8 w-8 text-[var(--accent)]" />
            </div>
          </div>

          <h1 className="mb-4 text-3xl font-bold tracking-tight text-[var(--foreground)] sm:text-4xl">
            Welcome to <span className="text-[var(--accent)]">Fund Tracker</span>
          </h1>

          <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            Your personal look-through dashboard for fund analysis.
            Add your funds, explore their underlying holdings, and stay on top
            of real-time news — all in one place.
          </p>
        </div>

        <div className="absolute bottom-12">
          <ScrollHint />
        </div>
      </section>

      {/* ── Section 2: Search & Add ──────────────────────────── */}
      <section className="relative flex min-h-screen snap-start flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute top-1/4 h-64 w-64 rounded-full bg-emerald-500/5 blur-[120px]" />

        <div className="relative mb-10 text-center">
          <StepBadge step={1} />
          <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
            Find &amp; add your funds
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            Use the search bar in the sidebar to look up any fund by name.
            Once you find the one you&apos;re looking for, hit <strong className="text-[var(--foreground)]">Add Fund</strong> and
            it&apos;ll be saved to your dashboard.
          </p>
        </div>

        <MockSearchBar />

        <div className="absolute bottom-12">
          <ScrollHint />
        </div>
      </section>

      {/* ── Section 3: Your Funds + News/Holdings ────────────── */}
      <section className="relative flex min-h-screen snap-start flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute top-1/4 h-64 w-64 rounded-full bg-purple-500/5 blur-[120px]" />

        <div className="relative mb-10 text-center">
          <StepBadge step={2} />
          <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
            Browse your funds
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            Your added funds appear right below the search bar. Select any fund to
            explore it. Switch between the <strong className="text-amber-400">News</strong> and{" "}
            <strong className="text-purple-400">Holdings</strong> tabs to see
            real-time articles or the full stock breakdown.
          </p>
        </div>

        <MockFundList />

        <div className="absolute bottom-12 mt-16">
          <ScrollHint />
        </div>
      </section>

      {/* ── Section 4: News Feed ─────────────────────────────── */}
      <section className="relative flex min-h-screen snap-start flex-col items-center justify-center px-6">
        <div className="pointer-events-none absolute top-1/4 h-64 w-64 rounded-full bg-blue-500/5 blur-[120px]" />

        <div className="relative mb-10 text-center">
          <StepBadge step={3} />
          <h2 className="mb-3 text-2xl font-bold text-[var(--foreground)]">
            Stay on top of the news
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-[var(--muted)]">
            Get an aggregated, real-time news feed for every stock held by your fund.
            Filter by country or sector to focus on what matters most to you.
          </p>
        </div>

        <MockNewsFeed />

        <div className="mt-12">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-hover)]"
          >
            Get started
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
