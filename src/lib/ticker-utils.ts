/**
 * Ticker Utility — "The Swedish Fix"
 *
 * Handles formatting tickers for different APIs.
 * Swedish stocks on OMX Stockholm need the .ST suffix.
 * Common patterns:
 *   VOLV-B  → VOLV-B.ST   (Volvo B-shares)
 *   ERIC-B  → ERIC-B.ST   (Ericsson B-shares)
 *   HM-B    → HM-B.ST     (H&M)
 *   AAPL    → AAPL         (US stock, no suffix)
 */

// Known exchange suffixes by country
const EXCHANGE_SUFFIXES: Record<string, string> = {
  SE: ".ST",   // OMX Stockholm
  DK: ".CO",   // OMX Copenhagen
  FI: ".HE",   // OMX Helsinki
  NO: ".OL",   // Oslo Børs
  DE: ".DE",   // XETRA
  UK: ".L",    // London
  US: "",      // NYSE/NASDAQ — no suffix
};

/**
 * Returns true if the ticker already has an exchange suffix.
 */
function hasExchangeSuffix(ticker: string): boolean {
  return /\.\w{1,3}$/.test(ticker);
}

/**
 * Formats a ticker with the correct exchange suffix for API calls.
 * If the ticker already has a suffix, it is returned as-is.
 *
 * @param ticker - Raw ticker symbol (e.g. "VOLV-B", "AAPL")
 * @param country - ISO 3166-1 alpha-2 country code (default: "SE")
 * @returns Formatted ticker (e.g. "VOLV-B.ST", "AAPL")
 */
export function formatTicker(ticker: string, country: string = "SE"): string {
  const cleaned = ticker.trim().toUpperCase();

  if (hasExchangeSuffix(cleaned)) {
    return cleaned;
  }

  const suffix = EXCHANGE_SUFFIXES[country.toUpperCase()] ?? "";
  return `${cleaned}${suffix}`;
}

/**
 * Strips the exchange suffix from a ticker for display purposes.
 * "VOLV-B.ST" → "VOLV-B"
 */
export function stripSuffix(ticker: string): string {
  return ticker.replace(/\.\w{1,3}$/, "");
}

/**
 * Detects the likely country from a ticker with suffix.
 * Returns "US" as default if no suffix is found.
 */
export function detectCountry(ticker: string): string {
  const suffixMatch = ticker.match(/\.(\w{1,3})$/);
  if (!suffixMatch) return "US";

  const suffix = `.${suffixMatch[1].toUpperCase()}`;
  for (const [country, s] of Object.entries(EXCHANGE_SUFFIXES)) {
    if (s === suffix) return country;
  }
  return "US";
}

/**
 * Converts a Finnhub-style ticker to our format.
 * Finnhub uses e.g. "VOLVO B" for Stockholm — we convert to "VOLV-B.ST".
 * This is a best-effort heuristic.
 */
export function normalizeFinnhubTicker(finnhubSymbol: string): string {
  // Finnhub Stockholm tickers often look like: "VOLVO B" or are already "VOLV-B.ST"
  if (hasExchangeSuffix(finnhubSymbol)) return finnhubSymbol;
  return finnhubSymbol.replace(/\s+/g, "-");
}
