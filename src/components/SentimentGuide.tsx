export default function SentimentGuide() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-10">

      {/* Header */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <h2 className="mb-2 text-base font-bold text-[var(--foreground)]">
          Sentiment Guide
        </h2>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          Every news article in your feed is automatically scored by an AI model
          that reads the headline and decides whether the tone is positive,
          negative, or neutral. This gives you a quick read on what the news is
          saying about a fund's holdings — without having to read every article
          yourself.
        </p>
      </div>

      {/* What the badges mean */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          What the badges mean
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)]">
          For each article, the AI assigns a probability across all three labels
          — they always add up to 100%. The badge shows whichever label scored
          highest.
        </p>

        {/* Example article */}
        <div className="mb-5 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-4 py-3">
          <p className="mb-3 text-xs font-medium text-[var(--foreground)]/70">
            Example headline: "Volvo reports record quarterly profit"
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="w-20 flex-shrink-0 rounded-md border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-center text-[10px] font-semibold text-green-400">
                ▲ 89%
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/5" style={{ height: 6 }}>
                <div className="h-full rounded-full bg-green-500/50" style={{ width: "89%" }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 flex-shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-center text-[10px] font-semibold text-[var(--muted)]">
                ● 8%
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/5" style={{ height: 6 }}>
                <div className="h-full rounded-full bg-white/20" style={{ width: "8%" }} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="w-20 flex-shrink-0 rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-center text-[10px] font-semibold text-red-400">
                ▼ 3%
              </span>
              <div className="flex-1 overflow-hidden rounded-full bg-white/5" style={{ height: 6 }}>
                <div className="h-full rounded-full bg-red-500/50" style={{ width: "3%" }} />
              </div>
            </div>
          </div>
          <p className="mt-3 text-[10px] text-[var(--muted)]/60">
            The badge on this article would show <span className="text-green-400 font-semibold">▲ 89%</span>
          </p>
        </div>

        {/* Label explanations */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 rounded-md border border-green-500/20 bg-green-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-green-400">▲ Positive</span>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Optimistic or constructive tone — strong earnings, a new product launch, upgraded analyst ratings.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 rounded-md border border-red-500/20 bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-400">▼ Negative</span>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Concerning or critical tone — a profit warning, regulatory trouble, or a broad market sell-off.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex-shrink-0 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--muted)]">● Neutral</span>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Factual or balanced without a strong lean — a routine announcement, market recap, or data release.
            </p>
          </div>
        </div>
      </div>

      {/* The sentiment bar */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)]">
          The sentiment bar in the sidebar
        </h3>
        <p className="mb-4 text-xs leading-relaxed text-[var(--muted)]">
          The thin coloured bar underneath each fund card summarises all of that
          fund's recent news at a glance.{" "}
          <span className="text-green-400">Green</span> is positive,{" "}
          <span className="text-[var(--foreground)]/60">grey</span> neutral, and{" "}
          <span className="text-red-400">red</span> negative.
        </p>

        {/* Sidebar panel mockup */}
        <div className="rounded-lg border border-[var(--card-border)] bg-[var(--sidebar-bg)] px-4 py-4">
          {/* YOUR FUNDS header */}
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/>
              <rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
            </svg>
            Your Funds
          </p>

          <div className="space-y-1.5">
            {/* Card 1 — selected, mostly positive */}
            <div className="rounded-lg border border-[var(--accent)]/50 bg-[var(--accent)]/10 px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-white">Swedbank Robur Teknologi</p>
              <p className="mt-0.5 text-[10px] text-[var(--muted)]">42 articles</p>
              <div className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className="bg-green-500/60" style={{ width: "63%" }} />
                <div className="bg-white/20" style={{ width: "24%" }} />
                <div className="bg-red-500/60" style={{ width: "13%" }} />
              </div>
            </div>

            {/* Card 2 — unselected, mixed */}
            <div className="rounded-lg border border-[var(--card-border)] px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-[var(--foreground)]">AMF Aktiefond Global</p>
              <p className="mt-0.5 text-[10px] text-[var(--muted)]">78 articles</p>
              <div className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className="bg-green-500/60" style={{ width: "35%" }} />
                <div className="bg-white/20" style={{ width: "38%" }} />
                <div className="bg-red-500/60" style={{ width: "27%" }} />
              </div>
            </div>

            {/* Card 3 — unselected, mostly negative */}
            <div className="rounded-lg border border-[var(--card-border)] px-3 py-2.5">
              <p className="truncate text-xs font-semibold text-[var(--foreground)]">Länsförsäkringar Europa</p>
              <p className="mt-0.5 text-[10px] text-[var(--muted)]">55 articles</p>
              <div className="mt-2 flex h-1 w-full overflow-hidden rounded-full bg-white/5">
                <div className="bg-green-500/60" style={{ width: "18%" }} />
                <div className="bg-white/20" style={{ width: "27%" }} />
                <div className="bg-red-500/60" style={{ width: "55%" }} />
              </div>
            </div>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-[var(--muted)]/60">
          The first fund has broadly positive coverage, the second is mixed, and the third is mostly negative.
        </p>
      </div>

      {/* How the AI works */}
      <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6">
        <h3 className="mb-3 text-sm font-semibold text-[var(--foreground)]">
          How the AI reads the news
        </h3>
        <p className="text-sm leading-relaxed text-[var(--muted)]">
          The model behind this feature was trained on a large collection of
          financial news articles where human experts had already labelled the
          tone of each piece. Over time, the model learned which words,
          phrases, and patterns in financial writing tend to signal good news
          versus bad news. When a new headline arrives, the model compares it
          against everything it learned and outputs a probability for each
          label — the highest probability wins.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
          Swedish articles are handled by a separate model trained across
          multiple European languages, so the quality of scoring holds up
          whether the article is in English or Swedish.
        </p>
      </div>

      {/* Keep in mind */}
      <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-6">
        <h3 className="mb-3 text-sm font-semibold text-amber-400">
          Keep in mind
        </h3>
        <ul className="space-y-2 text-xs leading-relaxed text-[var(--muted)]">
          <li className="flex gap-2">
            <span className="mt-0.5 text-amber-400/60">—</span>
            Sentiment reflects the tone of the news, not the
            underlying performance of a company or fund. Good news can still
            precede a price drop, and bad news can already be priced in.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-amber-400/60">—</span>
            The model reads headlines, not full articles. Nuanced or
            sarcastic writing can occasionally be misclassified.
          </li>
          <li className="flex gap-2">
            <span className="mt-0.5 text-amber-400/60">—</span>
            Use sentiment as one signal among many — not as a buy or sell
            recommendation on its own.
          </li>
        </ul>
      </div>

    </div>
  );
}
