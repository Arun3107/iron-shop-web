// app/api/admin/customers/route.ts
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

type CustomerMatch = {
  id: string;
  customer_name: string | null;
  phone: string | null;
  society_name: string | null;
  flat_number: string | null;
  block: string | null;
};

function normalizeFlat(value: string): string {
  // Lowercase and remove everything except a–z and 0–9
  // "T16", "t 16", "T:16" ⟶ "t16"
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// GET /api/admin/customers?society=...&flat=...
export async function GET(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const society = (url.searchParams.get("society") ?? "").trim();
  const flatInput = (url.searchParams.get("flat") ?? "").trim();

  // If we don't have enough info yet, just return empty matches (no error).
  if (!society || !flatInput) {
    return NextResponse.json({ matches: [] }, { status: 200 });
  }

  const normalizedFlat = normalizeFlat(flatInput);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabaseAny = supabase as any;

    const { data, error } = await supabaseAny
      .from("customers")
      .select("id, customer_name, phone, society_name, flat_number, block")
      .eq("society_name", society)
      .limit(100);

    if (error) {
      console.error("[GET /api/admin/customers] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to search customers" },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as CustomerMatch[];

    // Filter in JS using normalized flat
    const matches = rows.filter((row) => {
      if (!row.flat_number) return false;
      return normalizeFlat(row.flat_number) === normalizedFlat;
    });

    return NextResponse.json({ matches }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/admin/customers] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while searching customers" },
      { status: 500 }
    );
  }
}
