// app/api/orders/[id]/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type OrderUpdatePayload = {
  action?: "cancel";
  pickup_date?: string;
  pickup_slot?: "Morning" | "Evening";
  notes?: string | null;
  items_json?: Record<string, number>;
  items_estimated_total?: number | null;
  base_amount?: number | null;
  estimated_total?: number | null;
};


type OrderUpdateFields = {
  pickup_date?: string;
  pickup_slot?: string;
  notes?: string | null;
  items_json?: Record<string, number> | null;
  items_estimated_total?: number | null;
  base_amount?: number | null;
  estimated_total?: number | null;
};


function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE (or *_KEY).",
    );
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function extractOrderIdFromRequest(
  request: Request,
  params: { id?: string } | undefined,
): string | null {
  // 1) Try params first (normal Next.js behaviour)
  if (params?.id) return params.id;

  // 2) Fallback: derive from URL path
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean); // remove empty
  // Expect something like: ["api", "orders", "<id>"]
  const last = segments[segments.length - 1];
  const secondLast = segments[segments.length - 2];

  if (last && last !== "orders") return last;
  if (secondLast && secondLast !== "orders") return secondLast;

  return null;
}

export async function PATCH(
  request: Request,
  context: { params: { id?: string } },
) {
  const id = extractOrderIdFromRequest(request, context?.params);

  if (!id) {
    // Log once on server so we know what URL came in
    console.error("orders/[id] PATCH: Missing id in params and URL", {
      url: request.url,
      params: context?.params,
    });
    return NextResponse.json(
      { error: "Order id is required." },
      { status: 400 },
    );
  }

  let payload: OrderUpdatePayload;
  try {
    payload = (await request.json()) as OrderUpdatePayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 },
    );
  }

    const {
    action,
    pickup_date,
    pickup_slot,
    notes,
    items_json,
    items_estimated_total,
    base_amount,
    estimated_total,
  } = payload;


  let supabase;
  try {
    supabase = getSupabaseServerClient();
  } catch (err) {
    console.error("Supabase config error in orders/[id]:", err);
    return NextResponse.json(
      { error: "Server configuration error. Please contact support." },
      { status: 500 },
    );
  }

  try {
    // 🔹 CANCEL
    if (action === "cancel") {
      const { data, error } = await supabase
        .from("orders") // your table name is "orders"
        .update({ status: "CANCELLED" })
        .eq("id", id)
        .eq("status", "NEW")
        .select()
        .single();

      if (error) {
        console.error("Cancel order error", error);
        return NextResponse.json(
          { error: "Failed to cancel order." },
          { status: 500 },
        );
      }

      if (!data) {
        return NextResponse.json(
          {
            error:
              "Order not found or cannot be cancelled (already picked or delivered).",
          },
          { status: 400 },
        );
      }

      return NextResponse.json({ order: data });
    }

        // 🔹 MODIFY
    const updates: OrderUpdateFields = {};
    if (pickup_date) updates.pickup_date = pickup_date;
    if (pickup_slot) updates.pickup_slot = pickup_slot; // "Morning" | "Evening"
    if (typeof notes !== "undefined") updates.notes = notes;

    if (typeof items_json !== "undefined") {
      updates.items_json = items_json ?? null;
    }
    if (typeof items_estimated_total !== "undefined") {
      updates.items_estimated_total = items_estimated_total ?? null;
    }
    if (typeof base_amount !== "undefined") {
      updates.base_amount = base_amount ?? null;
    }
    if (typeof estimated_total !== "undefined") {
      updates.estimated_total = estimated_total ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "Nothing to update." },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", id)
      .eq("status", "NEW")
      .select()
      .single();


    if (error) {
      console.error("Update order error", error);
      return NextResponse.json(
        { error: "Failed to update order." },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error:
            "Order not found or cannot be modified (already picked or delivered).",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ order: data });
  } catch (err) {
    console.error("Unexpected orders/[id] error", err);
    return NextResponse.json(
      { error: "Unexpected error while updating order." },
      { status: 500 },
    );
  }
}
