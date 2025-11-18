import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // CRITICAL: Set cookies on BOTH request and response
          // Request cookies pass auth to Server Components
          // Response cookies update the browser
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({
            request,
          });

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

  // Refresh the auth token and validate the user
  // This ensures Server Components receive valid auth context
  await supabase.auth.getUser();

  return supabaseResponse;
}
