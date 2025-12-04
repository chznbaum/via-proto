import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";
import { UpdateMemberRoleRequestSchema } from "@/libs/validation/team-schema";

/**
 * PATCH /api/accounts/[accountId]/members/[userId]
 * Update a member's role
 * Requires owner or admin role (but cannot change owner's role)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; userId: string }> }
) {
  try {
    const { accountId, userId: targetUserId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify current user's membership and role
    let accountWithRole;
    try {
      accountWithRole = await getAccountWithRole(user.id, accountId);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    // Only owners and admins can change roles
    if (!["owner", "admin"].includes(accountWithRole.role)) {
      return NextResponse.json(
        { error: "You don't have permission to change roles" },
        { status: 403 }
      );
    }

    // 3. Get target user's current role
    const { data: targetMembership, error: targetError } = await supabase
      .from("account_users")
      .select("role")
      .eq("account_id", accountId)
      .eq("user_id", targetUserId)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json(
        { error: "User is not a member of this account" },
        { status: 404 }
      );
    }

    // Cannot change owner's role (must use transfer ownership)
    if (targetMembership.role === "owner") {
      return NextResponse.json(
        { error: "Cannot change the owner's role. Use transfer ownership instead." },
        { status: 400 }
      );
    }

    // Admins cannot change other admins' roles (only owner can)
    if (accountWithRole.role === "admin" && targetMembership.role === "admin") {
      return NextResponse.json(
        { error: "Admins cannot change other admins' roles" },
        { status: 403 }
      );
    }

    // 4. Validate input
    // Note: Schema only allows 'admin' or 'member', not 'owner'
    const body = await req.json();
    const { role: newRole } = UpdateMemberRoleRequestSchema.parse(body);

    // 5. Update role
    const { error: updateError } = await supabase
      .from("account_users")
      .update({ role: newRole })
      .eq("account_id", accountId)
      .eq("user_id", targetUserId);

    if (updateError) {
      console.error("Error updating member role:", updateError);
      return NextResponse.json(
        { error: "Failed to update member role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Role updated to ${newRole}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating member role:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/accounts/[accountId]/members/[userId]
 * Remove a member from the account
 * Owners/admins can remove others; users can remove themselves (leave)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; userId: string }> }
) {
  try {
    const { accountId, userId: targetUserId } = await params;
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Verify current user's membership and role
    let accountWithRole;
    try {
      accountWithRole = await getAccountWithRole(user.id, accountId);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    const isSelf = user.id === targetUserId;
    const canRemoveOthers = ["owner", "admin"].includes(accountWithRole.role);

    // Users can remove themselves (leave) or admins/owners can remove others
    if (!isSelf && !canRemoveOthers) {
      return NextResponse.json(
        { error: "You don't have permission to remove members" },
        { status: 403 }
      );
    }

    // 3. Get target user's role
    const { data: targetMembership, error: targetError } = await supabase
      .from("account_users")
      .select("role")
      .eq("account_id", accountId)
      .eq("user_id", targetUserId)
      .single();

    if (targetError || !targetMembership) {
      return NextResponse.json(
        { error: "User is not a member of this account" },
        { status: 404 }
      );
    }

    // Owner cannot leave (must transfer ownership first)
    if (targetMembership.role === "owner") {
      return NextResponse.json(
        { error: "The owner cannot leave. Transfer ownership first." },
        { status: 400 }
      );
    }

    // Admins cannot remove other admins (only owner can)
    if (
      accountWithRole.role === "admin" &&
      targetMembership.role === "admin" &&
      !isSelf
    ) {
      return NextResponse.json(
        { error: "Admins cannot remove other admins" },
        { status: 403 }
      );
    }

    // 4. Remove member
    const { error: deleteError } = await supabase
      .from("account_users")
      .delete()
      .eq("account_id", accountId)
      .eq("user_id", targetUserId);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    // 5. If user left (self-removal), update their default account if needed
    if (isSelf) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("default_account_id")
        .eq("id", user.id)
        .single();

      if (profile?.default_account_id === accountId) {
        // Find another account to set as default
        const { data: otherMembership } = await supabase
          .from("account_users")
          .select("account_id")
          .eq("user_id", user.id)
          .limit(1)
          .single();

        if (otherMembership) {
          await supabase
            .from("profiles")
            .update({ default_account_id: otherMembership.account_id })
            .eq("id", user.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: isSelf ? "You have left the account" : "Member removed",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
