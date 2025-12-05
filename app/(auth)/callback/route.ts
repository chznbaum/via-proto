import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  // Use NEXT_PUBLIC_SITE_URL instead of request origin to avoid Docker networking issues
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin;

  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error");
  const error_description = requestUrl.searchParams.get("error_description");

  // Handle error from Supabase
  if (error) {
    const errorMessage = error_description || error;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, siteUrl)
    );
  }

  // Verify token_hash with Supabase
  if (token_hash && type) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                maxAge: 14 * 24 * 60 * 60, // 14 days
              });
            });
          },
        },
      }
    );

    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
    });

    if (verifyError) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(verifyError.message)}`, siteUrl)
      );
    }

    // Session established - setup account for new users
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Call setup-account to handle new user registration
        const setupUrl = new URL("/api/auth/setup-account", siteUrl);
        await fetch(setupUrl.toString(), {
          method: "POST",
          headers: {
            cookie: cookieStore.toString(),
          },
        });
      }
    } catch {
      // Non-fatal - user is authenticated, account setup can be retried
      console.error("Failed to setup account, continuing to dashboard");
    }

    return NextResponse.redirect(new URL("/dashboard", siteUrl));
  }

  // No valid parameters found
  return NextResponse.redirect(
    new URL("/login?error=Invalid+authentication+link", siteUrl)
  );
}
