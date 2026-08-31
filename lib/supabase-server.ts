import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function fetchWithJwtClockSkewRetry(
  input: RequestInfo | URL,
  init?: RequestInit
) {
  const response = await fetch(input, init);

  if (response.ok) {
    return response;
  }

  const body = await response
    .clone()
    .text()
    .catch(() => "");

  // Immediately after login, Supabase can very briefly reject a newly issued
  // access token if PostgREST sees its issued-at time a fraction ahead of its
  // own clock. A manual browser refresh works because the token is valid by
  // then, so handle that tiny window automatically instead.
  if (!body.toLowerCase().includes("jwt issued at future")) {
    return response;
  }

  await new Promise((resolve) => setTimeout(resolve, 1500));
  return fetch(input, init);
}

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithJwtClockSkewRetry,
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },

        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The Proxy handles cookie refreshes when a Server Component
            // is not permitted to write cookies.
          }
        },
      },
    }
  );
}
