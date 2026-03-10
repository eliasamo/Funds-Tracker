/**
 * Mock fund holdings data — simulates what yfinance would return.
 *
 * In production, replace this with a real yfinance Python bridge or
 * a serverless function that calls the yfinance library.
 *
 * Each fund has an ISIN (primary key in Supabase), a name, and holdings[].
 */

export interface HoldingData {
  ticker: string;
  name: string;
  weight: number; // percentage, e.g. 8.2 = 8.2%
  sector: string;
  country: string;
}

export interface FundData {
  isin: string;
  name: string;
  holdings: HoldingData[];
}

const MOCK_FUNDS: FundData[] = [
  {
    isin: "SE0000803877",
    name: "Avanza Zero",
    holdings: [
      { ticker: "VOLV-B", name: "Volvo B", weight: 8.2, sector: "Industrials", country: "SE" },
      { ticker: "ERIC-B", name: "Ericsson B", weight: 6.5, sector: "Technology", country: "SE" },
      { ticker: "ATCO-A", name: "Atlas Copco A", weight: 7.1, sector: "Industrials", country: "SE" },
      { ticker: "INVE-B", name: "Investor B", weight: 6.8, sector: "Financials", country: "SE" },
      { ticker: "SEB-A", name: "SEB A", weight: 4.2, sector: "Financials", country: "SE" },
      { ticker: "SAND", name: "Sandvik", weight: 4.5, sector: "Industrials", country: "SE" },
      { ticker: "HM-B", name: "H&M B", weight: 3.8, sector: "Consumer Discretionary", country: "SE" },
      { ticker: "HEXA-B", name: "Hexagon B", weight: 3.5, sector: "Technology", country: "SE" },
      { ticker: "ASSA-B", name: "ASSA ABLOY B", weight: 4.1, sector: "Industrials", country: "SE" },
      { ticker: "ABB", name: "ABB Ltd", weight: 3.7, sector: "Industrials", country: "SE" },
      { ticker: "TELIA", name: "Telia Company", weight: 3.2, sector: "Telecom", country: "SE" },
      { ticker: "SWED-A", name: "Swedbank A", weight: 3.4, sector: "Financials", country: "SE" },
      { ticker: "SHB-A", name: "Handelsbanken A", weight: 3.1, sector: "Financials", country: "SE" },
      { ticker: "ALFA", name: "Alfa Laval", weight: 2.8, sector: "Industrials", country: "SE" },
      { ticker: "BOL", name: "Boliden", weight: 2.5, sector: "Materials", country: "SE" },
    ],
  },
  {
    isin: "SE0000740698",
    name: "Länsförsäkringar Sverige Aktiv",
    holdings: [
      { ticker: "VOLV-B", name: "Volvo B", weight: 9.5, sector: "Industrials", country: "SE" },
      { ticker: "ATCO-A", name: "Atlas Copco A", weight: 7.8, sector: "Industrials", country: "SE" },
      { ticker: "ERIC-B", name: "Ericsson B", weight: 5.5, sector: "Technology", country: "SE" },
      { ticker: "INVE-B", name: "Investor B", weight: 7.2, sector: "Financials", country: "SE" },
      { ticker: "ESSITY-B", name: "Essity B", weight: 3.3, sector: "Consumer Staples", country: "SE" },
      { ticker: "ELUX-B", name: "Electrolux B", weight: 2.2, sector: "Consumer Discretionary", country: "SE" },
      { ticker: "SKF-B", name: "SKF B", weight: 2.9, sector: "Industrials", country: "SE" },
      { ticker: "SCA-B", name: "SCA B", weight: 2.6, sector: "Materials", country: "SE" },
      { ticker: "KINV-B", name: "Kinnevik B", weight: 2.4, sector: "Financials", country: "SE" },
      { ticker: "SWMA", name: "Swedish Match", weight: 2.1, sector: "Consumer Staples", country: "SE" },
    ],
  },
  {
    isin: "SE0000597662",
    name: "SPP Aktiefond Global",
    holdings: [
      { ticker: "AAPL", name: "Apple Inc", weight: 7.2, sector: "Technology", country: "US" },
      { ticker: "MSFT", name: "Microsoft Corp", weight: 6.8, sector: "Technology", country: "US" },
      { ticker: "AMZN", name: "Amazon.com", weight: 4.5, sector: "Consumer Discretionary", country: "US" },
      { ticker: "GOOGL", name: "Alphabet Inc", weight: 4.1, sector: "Technology", country: "US" },
      { ticker: "TSLA", name: "Tesla Inc", weight: 2.5, sector: "Consumer Discretionary", country: "US" },
      { ticker: "NVDA", name: "NVIDIA Corp", weight: 3.8, sector: "Technology", country: "US" },
      { ticker: "NESN", name: "Nestlé", weight: 2.2, sector: "Consumer Staples", country: "CH" },
      { ticker: "ASML", name: "ASML Holding", weight: 1.9, sector: "Technology", country: "NL" },
      { ticker: "NOVO-B", name: "Novo Nordisk B", weight: 3.1, sector: "Healthcare", country: "DK" },
      { ticker: "ROG", name: "Roche Holding", weight: 1.8, sector: "Healthcare", country: "CH" },
    ],
  },
  {
    isin: "FI0008800511",
    name: "Nordea Nordenfond",
    holdings: [
      { ticker: "VOLV-B", name: "Volvo B", weight: 8.8, sector: "Industrials", country: "SE" },
      { ticker: "ERIC-B", name: "Ericsson B", weight: 5.2, sector: "Technology", country: "SE" },
      { ticker: "NOVO-B", name: "Novo Nordisk B", weight: 7.5, sector: "Healthcare", country: "DK" },
      { ticker: "DNORD", name: "Danske Bank", weight: 3.2, sector: "Financials", country: "DK" },
      { ticker: "EQNR", name: "Equinor", weight: 4.5, sector: "Energy", country: "NO" },
      { ticker: "DNB", name: "DNB Bank", weight: 2.8, sector: "Financials", country: "NO" },
      { ticker: "SAMPO", name: "Sampo", weight: 3.5, sector: "Financials", country: "FI" },
      { ticker: "NOKIA", name: "Nokia", weight: 2.2, sector: "Technology", country: "FI" },
      { ticker: "ATCO-A", name: "Atlas Copco A", weight: 6.2, sector: "Industrials", country: "SE" },
      { ticker: "SAND", name: "Sandvik", weight: 3.8, sector: "Industrials", country: "SE" },
    ],
  },
];

/**
 * Simulates a yfinance API call to get fund data.
 *
 * @param fundName - The fund name to look up
 * @returns Fund data with holdings, or null if not found
 */
export function getMockFund(fundName: string): FundData | null {
  // Try exact match first
  const exact = MOCK_FUNDS.find((f) => f.name === fundName);
  if (exact) return exact;

  // Try case-insensitive partial match
  return (
    MOCK_FUNDS.find((f) =>
      f.name.toLowerCase().includes(fundName.toLowerCase())
    ) ?? null
  );
}

/**
 * Returns all available fund names for the UI dropdown.
 */
export function getAvailableFunds(): string[] {
  return MOCK_FUNDS.map((f) => f.name);
}
