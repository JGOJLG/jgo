import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const day = searchParams.get("day");

  if (!day) {
    return NextResponse.json({ error: "Missing day." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("daily_four_state")
    .select("completed")
    .eq("day", day)
    .maybeSingle();

  if (error) {
    console.error("Unable to load Daily Four:", error);
    return NextResponse.json({ error: "Unable to load Daily Four." }, { status: 500 });
  }

  return NextResponse.json({ completed: data?.completed ?? [] });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { day?: string; completed?: string[] };

  if (!body.day || !Array.isArray(body.completed)) {
    return NextResponse.json({ error: "Invalid Daily Four state." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.from("daily_four_state").upsert(
    {
      day: body.day,
      completed: body.completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "day" }
  );

  if (error) {
    console.error("Unable to save Daily Four:", error);
    return NextResponse.json({ error: "Unable to save Daily Four." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
