import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: funds, error } = await supabase.from("funds").select("*");

    if (error) {
      console.error("Error fetching funds:", error);
      return NextResponse.json({ funds: [] });
    }

    return NextResponse.json({ funds: funds || [] });
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

  const { error } = await supabase.from("funds").delete().eq("isin", isin);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
