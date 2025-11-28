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

type OrderStatus = "NEW" | "PICKED" | "READY" | "DELIVERED";

interface Summary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  revenueByWorker: Record<string, number>;
}

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase client is not configured on the server");
  }
  return supabase;
}

// GET /api/admin/orders
// - ?date=YYYY-MM-DD                → list orders for that pickup date
// - ?summary=1&from=YYYY-MM-DD&to=YYYY-MM-DD → summary for date range
export async function GET(req: Request) {
  try {
    const client = ensureSupabase();
    const url = new URL(req.url);
    const search = url.searchParams;

    const summaryFlag = search.get("summary");
    const from = search.get("from");
    const to = search.get("to");

    // Summary mode for dashboard (week / month / custom range)
    if (summaryFlag && from && to) {
      const { data, error } = await client
        .from("orders")
        .select("id,status,total_price,worker_name")
        .gte("pickup_date", from)
        .lte("pickup_date", to);

      if (error) {
        console.error("Supabase summary error:", error);
        return NextResponse.json(
          { error: "Failed to load summary" },
          { status: 500 }
        );
      }

      const statusCounts: Record<OrderStatus, number> = {
        NEW: 0,
        PICKED: 0,
        READY: 0,
        DELIVERED: 0,
      };
      const revenueByWorker: Record<string, number> = {};
      let totalRevenue = 0;

      for (const row of data ?? []) {
        const st = row.status as OrderStatus | null;
        if (st && statusCounts[st] !== undefined) {
          statusCounts[st] += 1;
        }
        if (typeof row.total_price === "number") {
          totalRevenue += row.total_price;
        }
        const worker = row.worker_name as string | null;
        if (worker && typeof row.total_price === "number") {
          revenueByWorker[worker] =
            (revenueByWorker[worker] || 0) + row.total_price;
        }
      }

      const summary: Summary = {
        from,
        to,
        totalOrders: data?.length ?? 0,
        totalRevenue,
        statusCounts,
        revenueByWorker,
      };

      return NextResponse.json({ summary });
    }

    // Default: list orders for a specific pickup date (used in Orders tab)
    const date = search.get("date");
    if (!date) {
      return NextResponse.json(
        { error: "Missing date parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await client
      .from("orders")
      .select("*")
      .eq("pickup_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase orders fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("Admin GET /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading orders" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders
// 1) Single update (auto-save):
//    { id, status?, total_price?, worker_name? }
//
// 2) Bulk status update (e.g. "mark all NEW as PICKED"):
//    { ids: [...], status }
export async function PATCH(req: Request) {
  try {
    const client = ensureSupabase();
    const body = await req.json();

    // Bulk update
    if (Array.isArray(body.ids) && typeof body.status === "string") {
      const ids: string[] = body.ids;
      const status = body.status as OrderStatus;

      const { data, error } = await client
        .from("orders")
        .update({ status })
        .in("id", ids)
        .select("*");

      if (error) {
        console.error("Supabase bulk update error:", error);
        return NextResponse.json(
          { error: "Failed to update orders" },
          { status: 500 }
        );
      }

      return NextResponse.json({ orders: data ?? [] });
    }

    // Single partial update
    if (typeof body.id === "string") {
      const id: string = body.id;
      const patch: Record<string, unknown> = {};

      if (typeof body.status === "string") {
        patch.status = body.status as OrderStatus;
      }
      if ("total_price" in body) {
        patch.total_price =
          typeof body.total_price === "number"
            ? body.total_price
            : body.total_price === null
            ? null
            : null;
      }
      if ("worker_name" in body) {
        patch.worker_name =
          typeof body.worker_name === "string" && body.worker_name.length > 0
            ? body.worker_name
            : null;
      }

      if (Object.keys(patch).length === 0) {
        return NextResponse.json(
          { error: "No fields to update" },
          { status: 400 }
        );
      }

      const { data, error } = await client
        .from("orders")
        .update(patch)
        .eq("id", id)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase single update error:", error);
        return NextResponse.json(
          { error: "Failed to update order" },
          { status: 500 }
        );
      }

      return NextResponse.json({ order: data });
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
