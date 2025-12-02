// app/api/societies/route.ts
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

type Society = {
  id: string;
  name: string;
  created_at: string;
};

// GET /api/societies
// Returns all societies ordered alphabetically by name.
export async function GET() {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("societies")
      .select("id, name, created_at")
      .order("name", { ascending: true });

    if (error) {
      console.error("[GET /api/societies] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to load societies" },
        { status: 500 }
      );
    }

    const societies = (data ?? []) as Society[];

    return NextResponse.json({ societies }, { status: 200 });
  } catch (err) {
    console.error("[GET /api/societies] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while loading societies" },
      { status: 500 }
    );
  }
}

// POST /api/societies
// Body: { name: string }
export async function POST(request: Request) {
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase is not configured on the server" },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      name?: string;
    };

    const rawName = body.name ?? "";
    const name = rawName.trim();

    if (!name) {
      return NextResponse.json(
        { error: "Society name is required" },
        { status: 400 }
      );
    }

    // Supabase types don't know about the "societies" table yet,
// so we bypass TS here for this insert+select chain.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabaseAny = supabase as any;

const { data, error } = await supabaseAny
  .from("societies")
  .insert({ name })
  .select("id, name, created_at")
  .single();


    if (error) {
      const pgError = error as unknown as { code?: string };

      // Unique constraint violation on "name"
      if (pgError.code === "23505") {
        return NextResponse.json(
          { error: "A society with this name already exists" },
          { status: 409 }
        );
      }

      console.error("[POST /api/societies] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to create society" },
        { status: 500 }
      );
    }

    const society = data as Society;

    return NextResponse.json({ society }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/societies] Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected error while creating society" },
      { status: 500 }
    );
  }
}
