import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceRole) {
  supabase = createClient(supabaseUrl, supabaseServiceRole);
} else {
  console.error(
    "Supabase admin orders API: SUPABASE_URL or SUPABASE_SERVICE_ROLE missing"
  );
}

// ---------- GET: list orders for a given date ----------
export async function GET(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is not configured correctly." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    let dateToUse = dateParam;
    if (!dateToUse) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      dateToUse = `${yyyy}-${mm}-${dd}`;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("pickup_date", dateToUse)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase admin GET orders error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error("Admin GET /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading orders" },
      { status: 500 }
    );
  }
}

// ---------- PATCH: bulk status OR single total_price ----------
export async function PATCH(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is not configured correctly." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { ids, status, id, total_price } = body as {
      ids?: string[];
      status?: string;
      id?: string;
      total_price?: number;
    };

    // 1) Bulk status update: { ids: [...], status: "NEW" | "PICKED" | "DELIVERED" }
    if (Array.isArray(ids) && ids.length > 0 && typeof status === "string") {
      
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

      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    // 2) Single total_price update: { id: "order-id", total_price: 400 }
    if (id && typeof total_price === "number") {
      
      const { data, error } = await supabase
        .from("orders")
        .update({ total_price })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase PATCH order total_price error:", error);
        return NextResponse.json(
          { error: error.message || "Failed to update order" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data }, { status: 200 });
    }

    // If body doesn't match any expected shape
    return NextResponse.json(
      { error: "Invalid PATCH payload" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Admin PATCH /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while updating orders" },
      { status: 500 }
    );
  }
}
