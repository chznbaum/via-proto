import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createPersonalAccount, userHasProfile } from "@/libs/accounts";

export const dynamic = "force-dynamic";

// Called after magic link auth to ensure user has an account
// This handles the account creation that was previously in the callback route
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user already has a profile
    const hasProfile = await userHasProfile(user.id, supabase);

    if (hasProfile) {
      return NextResponse.json({ status: "existing" });
    }

    // New user - create their personal account using service role
    const serviceSupabase = new SupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const userEmail = user.email!;
    const userName =
      user.user_metadata?.full_name || user.user_metadata?.name || null;

    // Get avatar and name from cookies (set during registration)
    const pendingAvatar = req.cookies.get("pendingAvatar")?.value;
    const pendingName = req.cookies.get("pendingName")?.value;

    const avatarUrl = pendingAvatar
      ? decodeURIComponent(pendingAvatar)
      : null;
    const finalName = pendingName ? decodeURIComponent(pendingName) : userName;

    await createPersonalAccount(
      user.id,
      userEmail,
      finalName,
      serviceSupabase,
      avatarUrl
    );

    console.log(
      `Created personal account for new user: ${user.id} (${userEmail})`
    );

    // Create response and clear pending cookies
    const response = NextResponse.json({ status: "created" });
    response.cookies.delete("pendingAvatar");
    response.cookies.delete("pendingName");

    return response;
  } catch (error) {
    console.error("Error setting up account:", error);
    return NextResponse.json(
      { error: "Failed to setup account" },
      { status: 500 }
    );
  }
}
