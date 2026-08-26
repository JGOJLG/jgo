import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json();
    const id = Number(clientId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid client." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: client, error } = await supabase
      .from("clients")
      .select("id,email,portal_user_id")
      .eq("id", id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    const email = String(client.email || "").trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Add an email address first." }, { status: 400 });
    }

    if (!client.portal_user_id) {
      return NextResponse.json(
        { error: "This client has not created their member account yet. Send or resend the access email instead." },
        { status: 400 }
      );
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://www.jgohire.com/auth/callback?next=/reset-password",
    });

    if (resetError) {
      console.error("Portal password reset error", resetError);
      return NextResponse.json({ error: "Unable to send password reset email." }, { status: 500 });
    }

    return NextResponse.json({ message: "Password reset email sent." });
  } catch (error) {
    console.error("Portal password reset error", error);
    return NextResponse.json({ error: "Unable to send password reset email." }, { status: 500 });
  }
}
