import { NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseServiceRole) {
  supabase = createClient(supabaseUrl, supabaseServiceRole);
} else {
  console.error(
    "Supabase societies API: SUPABASE_URL or SUPABASE_SERVICE_ROLE is missing"
  );
}

// ---------- GET: list all society names ----------
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is not configured correctly." },
        { status: 500 }
      );
    }

    const { data, error } = await supabase
      .from("societies")
      .select("name")
      .order("name", { ascending: true });

    if (error) {
      console.error("Supabase GET societies error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load societies" },
        { status: 500 }
      );
    }

    const names = (data || []).map((row) => row.name as string);
    return NextResponse.json({ societies: names }, { status: 200 });
  } catch (err) {
    console.error("GET /api/societies error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading societies" },
      { status: 500 }
    );
  }
}

// ---------- POST: upsert one society name ----------
export async function POST(request: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: "Server is not configured correctly." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const rawName = (body?.name ?? "") as string;
    const name = rawName.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Society name is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("societies")
      .upsert({ name }, { onConflict: "name" })
      .select("id, name")
      .single();

    if (error) {
      console.error("Supabase POST societies error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to save society" },
        { status: 500 }
      );
    }

    return NextResponse.json({ society: data }, { status: 200 });
  } catch (err) {
    console.error("POST /api/societies error:", err);
    return NextResponse.json(
      { error: "Unexpected error while saving society" },
      { status: 500 }
    );
  }
}
