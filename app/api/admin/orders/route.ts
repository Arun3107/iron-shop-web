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

interface OrderRow {
  id: string;
  created_at: string;
  customer_name: string;
  phone: string;
  society_name: string;
  flat_number: string;
  pickup_date: string;
  pickup_slot: string;
  express_delivery: boolean;
  self_drop: boolean;
  notes: string | null;
  items_estimated_total: number | null;
  delivery_charge: number | null;
  express_charge: number | null;
  estimated_total: number | null;
  status: OrderStatus;
  total_price: number | null;
  worker_name?: string | null;
  base_amount?: number | null;
  items_json?: Record<string, number> | null;
}


interface Summary {
  from: string;
  to: string;
  totalOrders: number;
  totalRevenue: number;
  statusCounts: Record<OrderStatus, number>;
  revenueByWorker: Record<string, number>;
}

// GET /api/admin/orders
// - ?date=YYYY-MM-DD          -> list orders for that pickup_date
// - ?summary=1&from=..&to=..  -> summary across a date range
export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const summaryFlag = searchParams.get("summary");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Summary mode (dashboard)
    if (summaryFlag && (from || to)) {
      if (!from || !to) {
        return NextResponse.json(
          { error: "Both 'from' and 'to' must be provided for summary" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("orders")
        .select("id, pickup_date, status, total_price, worker_name")
        .gte("pickup_date", from)
        .lte("pickup_date", to);

      if (error) {
        console.error("Supabase summary query error:", error);
        return NextResponse.json(
          { error: "Failed to load summary" },
          { status: 500 }
        );
      }

      const rows = (data || []) as OrderRow[];

      const statusCounts: Record<OrderStatus, number> = {
        NEW: 0,
        PICKED: 0,
        READY: 0,
        DELIVERED: 0,
      };

      const revenueByWorker: Record<string, number> = {};

      let totalOrders = 0;
      let totalRevenue = 0;

      for (const row of rows) {
        totalOrders += 1;

        const price = row.total_price ?? 0;
        totalRevenue += price;

        const st = row.status;
        if (statusCounts[st] !== undefined) {
          statusCounts[st] += 1;
        }

        const worker = row.worker_name;
        if (worker) {
          revenueByWorker[worker] = (revenueByWorker[worker] || 0) + price;
        }
      }

      const summary: Summary = {
        from,
        to,
        totalOrders,
        totalRevenue,
        statusCounts,
        revenueByWorker,
      };

      return NextResponse.json({ summary });
    }

    // Non-summary: list orders for a single date
    const date = searchParams.get("date");
    if (!date) {
      return NextResponse.json(
        { error: "Missing 'date' query parameter" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("pickup_date", date)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Supabase orders query error:", error);
      return NextResponse.json(
        { error: "Failed to load orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data || [] });
  } catch (err) {
    console.error("Admin GET /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading orders" },
      { status: 500 }
    );
  }
}

// POST /api/admin/orders
// Used by admin to create walk-in orders from the Orders tab
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const {
      customer_name,
      phone,
      society_name,
      flat_number,
      pickup_date,
      pickup_slot,
      express_delivery,
      self_drop,
      status,
      notes,
    } = body ?? {};

    if (!society_name || !pickup_date) {
      return NextResponse.json(
        { error: "society_name and pickup_date are required" },
        { status: 400 }
      );
    }

    const insertPayload = {
      customer_name: customer_name || "Walk-in customer",
      phone: phone || "",
      society_name,
      flat_number: flat_number || "Walk-in",
      pickup_date,
      pickup_slot: pickup_slot || "Self drop",
      express_delivery: !!express_delivery,
      self_drop: self_drop ?? true,
      notes: notes ?? null,
      items_estimated_total: null,
      delivery_charge: null,
      express_charge: null,
      estimated_total: null,
      status: (status as OrderStatus) ?? "PICKED",
      total_price: null,
      worker_name: null,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase insert order error:", error);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    console.error("Admin POST /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating order" },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/orders
// - single order: { id, status?, worker_name?, total_price? }
// - bulk status: { ids: string[], status: OrderStatus }
export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Bulk update: { ids: string[], status: "PICKED" | other statuses }
    if (Array.isArray(body?.ids) && body.ids.length > 0 && body.status) {
      const ids = body.ids as string[];
      const status = body.status as OrderStatus;

      const { data, error } = await supabase
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

      return NextResponse.json({ orders: data || [] });
    }

    // Single order partial update
if (body?.id) {
  const patch: Partial<
    Pick<
      OrderRow,
      "status" | "worker_name" | "total_price" | "base_amount" | "items_json"
    >
  > = {};


      if (typeof body.status === "string") {
        patch.status = body.status as OrderStatus;
      }
      if (typeof body.worker_name === "string" || body.worker_name === null) {
        patch.worker_name = body.worker_name;
      }
      if (
        typeof body.total_price === "number" ||
        body.total_price === null
      ) {
        patch.total_price = body.total_price;
      }

      if (
  typeof body.base_amount === "number" ||
  body.base_amount === null
) {
  patch.base_amount = body.base_amount;
}
if (body.items_json && typeof body.items_json === "object") {
  patch.items_json = body.items_json as Record<string, number>;
}


      if (Object.keys(patch).length === 0) {
        return NextResponse.json(
          { error: "No valid fields to update" },
          { status: 400 }
        );
      }

      const { data, error } = await supabase
        .from("orders")
        .update(patch)
        .eq("id", body.id)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase update error:", error);
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
