import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";
import { transferOwnership } from "@/libs/teams";

/**
 * POST /api/accounts/[accountId]/members/[userId]/transfer-ownership
 * Transfer account ownership to another member
 * Only the current owner can do this
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; userId: string }> }
) {
  try {
    const { accountId, userId: newOwnerId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify current user is the owner
    let accountWithRole;
    try {
      accountWithRole = await getAccountWithRole(user.id, accountId);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    if (accountWithRole.role !== "owner") {
      return NextResponse.json(
        { error: "Only the account owner can transfer ownership" },
        { status: 403 }
      );
    }

    // 3. Cannot transfer to self
    if (user.id === newOwnerId) {
      return NextResponse.json(
        { error: "You are already the owner" },
        { status: 400 }
      );
    }

    // 4. Verify new owner is a member
    const { data: newOwnerMembership, error: memberError } = await supabase
      .from("account_users")
      .select("role")
      .eq("account_id", accountId)
      .eq("user_id", newOwnerId)
      .single();

    if (memberError || !newOwnerMembership) {
      return NextResponse.json(
        { error: "User is not a member of this account" },
        { status: 404 }
      );
    }

    // 5. Transfer ownership
    await transferOwnership(accountId, user.id, newOwnerId, supabase);

    return NextResponse.json({
      success: true,
      message: "Ownership transferred successfully",
    });
  } catch (error) {
    console.error("Error transferring ownership:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
