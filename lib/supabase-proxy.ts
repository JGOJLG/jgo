import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return response;
  } catch (error) {
    console.warn("Supabase session refresh failed; clearing stale auth cookies.", error);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
  const redirectResponse = NextResponse.redirect(loginUrl);
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith("sb-") && name.includes("auth-token")) redirectResponse.cookies.set(name, "", { maxAge: 0, path: "/" });
  });
  return redirectResponse;
}
