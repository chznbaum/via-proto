import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";

/**
 * GET /api/accounts/[accountId]/members
 * List all members of an account with their roles
 * Requires membership in the account
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify membership
    try {
      await getAccountWithRole(user.id, accountId);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    // 3. Get all members with their profile info
    const { data: memberships, error: membershipsError } = await supabase
      .from("account_users")
      .select(
        `
        role,
        created_at,
        profiles!inner (
          id,
          name,
          avatar_url
        )
      `
      )
      .eq("account_id", accountId);

    if (membershipsError) {
      console.error("Error fetching members:", membershipsError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Get user emails from auth (requires service role in production)
    // For now, we'll join with profiles which should have the user's name

    const members = (memberships || []).map((m: any) => ({
      user_id: m.profiles.id,
      name: m.profiles.name || "Unknown",
      avatar_url: m.profiles.avatar_url,
      role: m.role,
      joined_at: m.created_at,
    }));

    return NextResponse.json({ members });
  } catch (error) {
    console.error("Error fetching members:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
