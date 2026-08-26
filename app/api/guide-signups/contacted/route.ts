import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { signupId } = await request.json();
    const id = String(signupId || "").trim();
    if (!id) return NextResponse.json({ error: "Invalid signup." }, { status: 400 });

    const supabase = await createClient();
    const { error } = await supabase
      .from("job_search_guide_leads")
      .update({ funnel_status: "Contacted", contacted_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to update signup." }, { status: 500 });
  }
}
