"use client";

import { Globe, Factory, X } from "lucide-react";

interface NewsFiltersProps {
  countries: string[];
  sectors: string[];
  selectedCountry: string;
  selectedSector: string;
  onCountryChange: (country: string) => void;
  onSectorChange: (sector: string) => void;
  totalResults: number;
  filteredResults: number;
}

export default function NewsFilters({
  countries,
  sectors,
  selectedCountry,
  selectedSector,
  onCountryChange,
  onSectorChange,
  totalResults,
  filteredResults,
}: NewsFiltersProps) {
  const selectClass =
    "rounded-md border border-[var(--card-border)] bg-[var(--card-bg)] px-2.5 py-1.5 text-xs text-[var(--foreground)] outline-none transition focus:border-[var(--accent)]";

  const hasFilters = selectedCountry || selectedSector;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Country filter */}
      <div className="flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5 flex-shrink-0 text-[var(--muted)]" />
        <select
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className={selectClass}
        >
          <option value="">All Countries</option>
          {countries.map((c) => (
            <option key={c} value={c}>
              {countryLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {/* Sector filter */}
      <div className="flex items-center gap-1.5">
        <Factory className="h-3.5 w-3.5 flex-shrink-0 text-[var(--muted)]" />
        <select
          value={selectedSector}
          onChange={(e) => onSectorChange(e.target.value)}
          className={selectClass}
        >
          <option value="">All Sectors</option>
          {sectors.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <button
          onClick={() => {
            onCountryChange("");
            onSectorChange("");
          }}
          className="flex items-center gap-1 rounded-md border border-[var(--card-border)] px-2 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)]/40 hover:text-[var(--foreground)]"
        >
          <X className="h-3 w-3" />
          Clear
        </button>
      )}

      {/* Article count */}
      <span className="ml-auto text-xs text-[var(--muted)]">
        {filteredResults}{" "}
        <span className="text-[var(--muted)]/60">/ {totalResults} articles</span>
      </span>
    </div>
  );
}

function countryLabel(code: string): string {
  const labels: Record<string, string> = {
    SE: "🇸🇪 Sweden",
    US: "🇺🇸 USA",
    DK: "🇩🇰 Denmark",
    FI: "🇫🇮 Finland",
    NO: "🇳🇴 Norway",
    DE: "🇩🇪 Germany",
    UK: "🇬🇧 UK",
    CH: "🇨🇭 Switzerland",
    NL: "🇳🇱 Netherlands",
  };
  return labels[code] || code;
}
