import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

let supabase: ReturnType<typeof createClient> | null = null;

if (supabaseUrl && supabaseServiceRole) {
  supabase = createClient(supabaseUrl, supabaseServiceRole);
} else {
  console.error(
    "Supabase env vars missing. SUPABASE_URL or SUPABASE_SERVICE_ROLE not set."
  );
}

// GET /api/customer?phone=xxxxx
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");

    if (!phone || !phone.trim()) {
      return NextResponse.json(
        { error: "Missing phone query param" },
        { status: 400 }
      );
    }

    const trimmed = phone.trim();

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("phone", trimmed)
      .maybeSingle();

    if (error) {
      console.error("Supabase get customer error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load customer" },
        { status: 500 }
      );
    }

    return NextResponse.json({ customer: data }, { status: 200 });
  } catch (err) {
    console.error("Customer API error:", err);
    return NextResponse.json(
      { error: "Unexpected error in /api/customer" },
      { status: 500 }
    );
  }
}
