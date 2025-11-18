import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Set max-age to 7 days for real cookies, keep original options for deletions
            const cookieOptions = value
              ? { ...options, maxAge: 7 * 24 * 60 * 60 } // 7 days in seconds
              : options; // Keep original options when deleting (empty value)

            supabaseResponse.cookies.set(name, value, cookieOptions);
          });
        },
      },
    }
  );

  // refreshing the auth token
  await supabase.auth.getUser();

  return supabaseResponse;
}
