import { NextResponse } from "next/server";
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
