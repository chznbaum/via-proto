import { NextResponse, NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  createPersonalAccount,
  userHasProfile,
} from "@/libs/accounts";
import config from "@/config";

export const dynamic = "force-dynamic";

// This route is called after a successful login. It exchanges the code for a session and redirects to the callback URL (see config.js).
export async function GET(req: NextRequest) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const redirectUrl = requestUrl.origin + config.auth.callbackUrl;

  if (code) {
    // Create the redirect response first
    const response = NextResponse.redirect(redirectUrl);

    // Create Supabase client with cookie handling that sets on the response
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set max-age to 7 days for real cookies, keep original options for deletions
              const cookieOptions = value
                ? { ...options, maxAge: 7 * 24 * 60 * 60 } // 7 days in seconds
                : options; // Keep original options when deleting (empty value)

              response.cookies.set(name, value, cookieOptions);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(requestUrl.origin + config.auth.loginUrl);
    }

    // Check if this is a new user (first sign-in)
    if (data?.user) {
      const hasProfile = await userHasProfile(data.user.id, supabase);

      if (!hasProfile) {
        // New user - create their personal account
        // Use service role client to bypass RLS for account creation
        const serviceSupabase = new SupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        try {
          const userEmail = data.user.email!;
          const userName =
            data.user.user_metadata?.full_name ||
            data.user.user_metadata?.name ||
            null;

          await createPersonalAccount(
            data.user.id,
            userEmail,
            userName,
            serviceSupabase
          );

          console.log(
            `Created personal account for new user: ${data.user.id} (${userEmail})`
          );
        } catch (error) {
          console.error("Error creating personal account:", error);
          // Note: We don't redirect to error page here because the user is authenticated.
          // They can still access the app, and we can show an error message in the dashboard.
        }
      }
    }

    // Return the response with cookies set
    return response;
  }

  // If no code, just redirect
  return NextResponse.redirect(redirectUrl);
}
