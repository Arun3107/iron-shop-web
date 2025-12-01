// app/api/admin/orders/route.ts
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

// -------------------- GET /api/admin/orders --------------------
// Returns all orders, optionally filtered by pickup_date (?date=YYYY-MM-DD)
// Your admin UI currently calls: /api/admin/orders?date=ALL
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

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: true });

    if (date !== "ALL") {
      // date is expected to be YYYY-MM-DD
      query = query.eq("pickup_date", date);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Admin GET /api/admin/orders error:", error);
      return NextResponse.json(
        { error: "Failed to load orders" },
        { status: 500 }
      );
    }

    return NextResponse.json({ orders: data ?? [] });
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
    const body = await request.json();

    const {
      customer_name,
      phone,
      society_name,
      flat_number,
      pickup_date,
      pickup_slot,
      express_delivery,
      notes,
      status,
      self_drop,
      block,
    } = body;

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
          block: block ?? null,
        },
        {
          onConflict: "phone", // uses customers_phone_key
        }
      );

    if (customerError) {
      console.error("Admin POST /api/admin/orders customer upsert error:", customerError);
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
          express_delivery: !!express_delivery,
          notes: notes ?? null,
          status: status ?? "NEW",
          self_drop: !!self_drop,
          block: block ?? null,
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
// - Single update: { id, status?, worker_name?, total_price?, base_amount?, items_json? }
// - Bulk status:   { ids: string[], status }
export async function PATCH(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase client not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    // Bulk status update: { ids: string[], status }
    if (Array.isArray(body.ids) && body.ids.length > 0 && body.status) {
      const { error } = await supabase
        .from("orders")
        .update({ status: body.status as string })
        .in("id", body.ids);

      if (error) {
        console.error("Admin PATCH /api/admin/orders bulk update error:", error);
        return NextResponse.json(
          { error: "Failed to update orders" },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Single row update: { id, status?, worker_name?, total_price?, base_amount?, items_json? }
    const { id, status, worker_name, total_price, base_amount, items_json } =
      body ?? {};

    if (!id) {
      return NextResponse.json(
        { error: "Missing order id for update" },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {};

    if (typeof status === "string") {
      patch.status = status;
    }
    if (typeof worker_name === "string" || worker_name === null) {
      patch.worker_name = worker_name;
    }
    if (typeof total_price === "number" || total_price === null) {
      patch.total_price = total_price;
    }
    if (typeof base_amount === "number" || base_amount === null) {
      patch.base_amount = base_amount;
    }
    if (items_json && typeof items_json === "object") {
      // always send an object to jsonb column
      patch.items_json = items_json;
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
