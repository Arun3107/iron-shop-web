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

/**
 * Status priority:
 * Open at top: NEW → PICKED → READY → everything else
 * Within each group: newest first
 */
const STATUS_PRIORITY: Record<string, number> = {
  NEW: 0,
  PICKED: 1,
  READY: 2,
};

type DbOrderRow = Record<string, unknown> & {
  status?: string | null;
  created_at?: string | null;
};

function toDbOrderRow(v: unknown): DbOrderRow {
  return (v ?? {}) as DbOrderRow;
}

function safeTime(v: unknown): number {
  if (typeof v !== "string" || !v) return 0;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : 0;
}

// -------------------- GET /api/admin/orders --------------------
// Returns orders, optionally filtered by pickup_date (?date=YYYY-MM-DD)
// Admin UI currently calls: /api/admin/orders?date=ALL
export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || "ALL";

    let query = supabase.from("orders").select("*");

    if (date !== "ALL") {
      query = query.eq("pickup_date", date);
    }

    // ✅ IMPORTANT:
    // With 1000+ rows, responses can get capped.
    // So pull a recent window, then do "open-first" sort in code.
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .range(0, 1999);

    if (error) {
      console.error("Admin GET /api/admin/orders error:", error);
      return NextResponse.json(
        { error: "Failed to load orders" },
        { status: 500 }
      );
    }

    const raw = (Array.isArray(data) ? data : []) as unknown[];

    const orders = raw
      .map(toDbOrderRow)
      .slice()
      .sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status ?? ""] ?? 99;
        const pb = STATUS_PRIORITY[b.status ?? ""] ?? 99;
        if (pa !== pb) return pa - pb;

        const ta = safeTime(a.created_at);
        const tb = safeTime(b.created_at);
        return tb - ta; // newest first within same status
      });

    return NextResponse.json({ orders });
  } catch (err) {
    console.error("Admin GET /api/admin/orders unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading orders" },
      { status: 500 }
    );
  }
}

// -------------------- POST /api/admin/orders --------------------
// Used by Admin Walk-in tab to create a new order.
// Also upserts customer row in `customers` using phone as the unique key.
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const bodyUnknown: unknown = await request.json();
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;

    const customer_name =
      typeof body.customer_name === "string" ? body.customer_name : "";
    const phone = typeof body.phone === "string" ? body.phone : "";
    const society_name =
      typeof body.society_name === "string" ? body.society_name : "";
    const flat_number =
      typeof body.flat_number === "string" ? body.flat_number : "";
    const pickup_date =
      typeof body.pickup_date === "string" ? body.pickup_date : "";
    const pickup_slot =
      typeof body.pickup_slot === "string" ? body.pickup_slot : "";

    const notes = typeof body.notes === "string" ? body.notes : null;
    const status = typeof body.status === "string" ? body.status : "NEW";
    const self_drop = !!body.self_drop;
    const block = typeof body.block === "string" ? body.block : null;

    if (
      !customer_name ||
      !phone ||
      !society_name ||
      !flat_number ||
      !pickup_date ||
      !pickup_slot
    ) {
      return NextResponse.json(
        { error: "Missing required fields for order creation" },
        { status: 400 }
      );
    }

    // 1) Upsert into customers using phone as the unique key
    const { error: customerError } = await supabase
      .from("customers")
      .upsert(
        {
          customer_name,
          phone,
          society_name,
          flat_number,
          block,
        },
        { onConflict: "phone" } // customers_phone_key
      );

    if (customerError) {
      console.error(
        "Admin POST /api/admin/orders customer upsert error:",
        customerError
      );
      return NextResponse.json(
        { error: "Failed to upsert customer" },
        { status: 500 }
      );
    }

    // 2) Insert the order, including block
    const { data, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          customer_name,
          phone,
          society_name,
          flat_number,
          pickup_date,
          pickup_slot,
          notes,
          status,
          self_drop,
          block,
        },
      ])
      .select()
      .single();

    if (orderError) {
      console.error("Admin POST /api/admin/orders order insert error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data }, { status: 201 });
  } catch (err) {
    console.error("Admin POST /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating order" },
      { status: 500 }
    );
  }
}

// -------------------- PATCH /api/admin/orders --------------------
// - Bulk status:   { ids: string[], status }
// - Single update: { id, status?, worker_name?, total_price?, base_amount?, items_json? }
export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const bodyUnknown: unknown = await request.json();
    const body = (bodyUnknown ?? {}) as Record<string, unknown>;

    const status =
      typeof body.status === "string" ? (body.status as string) : null;

    // Bulk status update
    const ids = Array.isArray(body.ids) ? body.ids : null;
    const idsStr =
      ids?.filter((x) => typeof x === "string") as string[] | undefined;

    if (idsStr && idsStr.length > 0 && status) {
      const nowIso = new Date().toISOString();

      const bulkPatch: Record<string, unknown> = { status };

      if (status === "PICKED") bulkPatch.picked_at = nowIso;
      if (status === "READY") bulkPatch.ready_at = nowIso;
      if (status === "DELIVERED") bulkPatch.delivered_at = nowIso;

      const { error } = await supabase
        .from("orders")
        .update(bulkPatch)
        .in("id", idsStr);

      if (error) {
        console.error("Admin PATCH /api/admin/orders bulk update error:", error);
        return NextResponse.json(
          { error: "Failed to update orders" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Single row update
    const id = typeof body.id === "string" ? body.id : "";

    if (!id) {
      return NextResponse.json(
        { error: "Missing order id for update" },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {};

    if (status) {
      patch.status = status;

      const nowIso = new Date().toISOString();
      if (status === "PICKED") patch.picked_at = nowIso;
      if (status === "READY") patch.ready_at = nowIso;
      if (status === "DELIVERED") patch.delivered_at = nowIso;
    }

    if (typeof body.worker_name === "string" || body.worker_name === null) {
      patch.worker_name = body.worker_name;
    }

    if (typeof body.total_price === "number" || body.total_price === null) {
      patch.total_price = body.total_price;
    }

    if (typeof body.base_amount === "number" || body.base_amount === null) {
      patch.base_amount = body.base_amount;
    }

    if (
      typeof body.items_json === "object" &&
      body.items_json !== null &&
      !Array.isArray(body.items_json)
    ) {
      patch.items_json = body.items_json as Record<string, unknown>;
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
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Admin PATCH /api/admin/orders update error:", error);
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 }
      );
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    console.error("Admin PATCH /api/admin/orders error:", err);
    return NextResponse.json(
      { error: "Unexpected error while updating orders" },
      { status: 500 }
    );
  }
}