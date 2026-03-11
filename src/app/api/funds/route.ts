import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ funds: [] }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("user_funds")
      .select("fund_isin, funds(isin, name)")
      .eq("user_id", user.id)
      .order("added_at", { ascending: true });

    if (error) {
      console.error("Error fetching funds:", error);
      return NextResponse.json({ funds: [] });
    }

    const funds = (data || []).map((row: any) => row.funds).filter(Boolean);
    return NextResponse.json({ funds });
  } catch (err) {
    console.error("Unexpected error in /api/funds:", err);
    return NextResponse.json({ funds: [] }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  const isin = request.nextUrl.searchParams.get("isin");

  if (!isin) {
    return NextResponse.json({ error: "isin is required" }, { status: 400 });
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("user_funds")
    .delete()
    .eq("user_id", user.id)
    .eq("fund_isin", isin);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
