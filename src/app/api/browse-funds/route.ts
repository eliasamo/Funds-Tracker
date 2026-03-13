import { NextRequest, NextResponse } from "next/server";

const LIST_URL =
  "https://www.avanza.se/_api/fund-guide/list?shouldCheckFundExcludedFromPromotion=true";

const BASE_BODY = {
  startIndex: 0,
  managedType: "ANY",
  svanenMark: false,
  sortField: "developmentThreeYears",
  sortDirection: "DESCENDING",
  name: "",
  commonRegionFilter: [],
  otherRegionFilter: [],
  fundTypeFilter: [],
  industryFilter: [],
  companyFilter: [],
  ratingFilter: [],
  riskFilter: [],
  sustainabilityRatingFilter: [],
  euArticleTypeFilter: [],
  alignmentFilter: [],
  sustainableDevelopmentGoalsAlignmentFilter: [],
  productInvolvementsFilter: [],
  recommendedHoldingPeriodFilter: [],
  environmentalRatingFilter: [],
  socialRatingFilter: [],
  governanceRatingFilter: [],
  interestTypeFilter: [],
  cashDividends: false,
  maxTotalFee: null,
};

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10));

  try {
    const res = await fetch(LIST_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
        "Accept-Language": "sv-SE,sv;q=0.9",
        Referer: "https://www.avanza.se/fonder/handla-fonder.html",
        Origin: "https://www.avanza.se",
      },
      body: JSON.stringify({
        ...BASE_BODY,
        name: q,
        startIndex: page * PAGE_SIZE,
      }),
    });

    if (!res.ok) throw new Error(`Avanza HTTP ${res.status}`);

    const data = await res.json();
    const raw: { name: string; isin: string }[] = data.fundListViews ?? [];

    return NextResponse.json({
      funds: raw.map(({ name, isin }) => ({ name, isin })),
      hasMore: raw.length >= PAGE_SIZE,
      page,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
