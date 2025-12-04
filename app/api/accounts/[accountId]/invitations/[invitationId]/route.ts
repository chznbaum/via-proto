import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/libs/supabase/server";
import { requireAccountAdmin } from "@/libs/auth";

/**
 * DELETE /api/accounts/[accountId]/invitations/[invitationId]
 * Revoke a pending invitation
 * Requires admin/owner role
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string; invitationId: string }> }
) {
  try {
    const { accountId, invitationId } = await params;

    // Verify user is admin/owner of this account
    await requireAccountAdmin(accountId);

    const supabase = await createClient();

    // Verify invitation exists and belongs to this account
    const { data: invitation, error: fetchError } = await supabase
      .from("account_invitations")
      .select("id, email, accepted_at")
      .eq("id", invitationId)
      .eq("account_id", accountId)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: "Cannot revoke an accepted invitation" },
        { status: 400 }
      );
    }

    // Delete the invitation
    const { error: deleteError } = await supabase
      .from("account_invitations")
      .delete()
      .eq("id", invitationId);

    if (deleteError) {
      console.error("Error deleting invitation:", deleteError);
      return NextResponse.json(
        { error: "Failed to revoke invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Invitation to ${invitation.email} has been revoked`,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error in DELETE invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
