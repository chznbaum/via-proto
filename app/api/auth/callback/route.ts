import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
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

  if (code) {
    const supabase = await createClient();
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
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + config.auth.callbackUrl);
}
