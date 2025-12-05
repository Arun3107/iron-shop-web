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

// GET /api/my-orders?phone=xxxxx
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
  .from("orders")
.select(
  "id, created_at, pickup_date, pickup_slot, society_name, flat_number, status, estimated_total, total_price, express_delivery, self_drop, notes, items_json, items_estimated_total"
)
  .eq("phone", trimmed)
  .order("created_at", { ascending: false })
  .limit(10);


    if (error) {
      console.error("Supabase my-orders error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("My Orders API error:", err);
    return NextResponse.json(
      { error: "Unexpected error in /api/my-orders" },
      { status: 500 }
    );
  }
}
