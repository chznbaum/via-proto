import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle error from Supabase
  if (error) {
    const errorMessage = error_description || error;
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url)
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
      type: type as "email" | "sms" | "phone_change" | "email_change",
    });

    if (verifyError) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(verifyError.message)}`, request.url)
      );
    }

    // Session established - setup account for new users
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Call setup-account to handle new user registration
        const setupUrl = new URL("/api/auth/setup-account", request.url);
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

    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // No valid parameters found
  return NextResponse.redirect(
    new URL("/login?error=Invalid+authentication+link", request.url)
  );
}
