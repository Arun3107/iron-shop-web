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

// GET /api/admin/orders?date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Missing date query param (YYYY-MM-DD)" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("pickup_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase GET orders error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("Admin GET orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error in GET /api/admin/orders" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders
// For single order: { id, status?, total_price? }
// For bulk  : { ids: [id1, id2, ...], status }
export async function PATCH(req: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const body = await req.json();

    const { id, ids, status, total_price } = body as {
      id?: string;
      ids?: string[];
      status?: string;
      total_price?: number | null;
    };

    // Bulk update
    if (Array.isArray(ids) && ids.length > 0 && status) {
      const { data, error } = await supabase
        .from("orders")
        .update({ status })
        .in("id", ids)
        .select();

      if (error) {
        console.error("Supabase bulk PATCH orders error:", error);
        return NextResponse.json(
          { error: error.message || "Failed to update orders" },
          { status: 500 }
        );
      }

      return NextResponse.json({ orders: data }, { status: 200 });
    }

    // Single row update
    if (!id) {
      return NextResponse.json(
        { error: "Missing order id" },
        { status: 400 }
      );
    }

    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (total_price !== undefined) update.total_price = total_price;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update(update)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase PATCH orders error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data }, { status: 200 });
  } catch (err) {
    console.error("Admin PATCH orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error in PATCH /api/admin/orders" },
      { status: 500 }
    );
  }
}
