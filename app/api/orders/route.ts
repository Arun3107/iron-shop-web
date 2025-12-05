import { NextResponse } from "next/server";
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

/**
 * Save a new order + update customer profile
 */
export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        {
          error:
            "Server is not configured correctly (Supabase env vars missing).",
        },
        { status: 500 }
      );
    }

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
      items_estimated_total,
      delivery_charge,
      express_charge,
      estimated_total,
      self_drop,
      items_json,
      base_amount,
      block,
    } = body;


    // Basic validation
    if (
      !customer_name ||
      !phone ||
      !society_name ||
      !flat_number ||
      !pickup_date ||
      !pickup_slot
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

   // eslint-disable-next-line @typescript-eslint/no-explicit-any
const { data: order, error: orderError } = await (supabase as any)
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
      self_drop: !!self_drop,
      notes: notes || null,

      // money + items
      items_estimated_total: items_estimated_total ?? null,
      delivery_charge: delivery_charge ?? null,
      express_charge: express_charge ?? null,
      estimated_total: estimated_total ?? null,
      base_amount: base_amount ?? null,
      items_json: items_json ?? null,
      block: block ?? null,

      // defaults
      status: "NEW",
      total_price: null,
    }
,
  ])
  .select()
  .single();




    if (orderError) {
      console.error("Supabase insert order error:", orderError);
      return NextResponse.json(
        { error: orderError.message || "Failed to save order" },
        { status: 500 }
      );
    }

    // 2) Upsert customer profile (by phone)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const { error: customerError } = await (supabase as any)
  .from("customers")
  .upsert(
        [
      {
        customer_name,
        phone,
        society_name,
        flat_number,
        block: block ?? null,
      },
    ],

    { onConflict: "phone" }
  );


    if (customerError) {
      // Not fatal for the customer – just log
      console.error("Supabase upsert customer error:", customerError);
    }

    return NextResponse.json(
      { success: true, order },
      { status: 200 }
    );
  } catch (err) {
    console.error("Orders API error:", err);
    return NextResponse.json(
      { error: "Unexpected error while saving order" },
      { status: 500 }
    );
  }
}
