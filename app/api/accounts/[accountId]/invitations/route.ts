import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { requireAccountAdmin } from "@/libs/auth";
import {
  createInvitation,
  sendInvitationEmail,
  checkSeatLimit,
} from "@/libs/teams";
import { CreateInvitationRequestSchema } from "@/libs/validation/team-schema";

/**
 * GET /api/accounts/[accountId]/invitations
 * List all invitations for an account (pending and accepted)
 * Requires admin/owner role
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Verify user is admin/owner of this account
    await requireAccountAdmin(accountId);

    const supabase = await createClient();

    // Fetch invitations with inviter info
    const { data: invitations, error } = await supabase
      .from("account_invitations")
      .select(
        `
        id,
        email,
        role,
        expires_at,
        accepted_at,
        created_at,
        inviter:profiles!invited_by_user_id(id, name, avatar_url),
        acceptor:profiles!accepted_by_user_id(id, name, avatar_url)
      `
      )
      .eq("account_id", accountId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching invitations:", error);
      return NextResponse.json(
        { error: "Failed to fetch invitations" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invitations });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("Error in GET invitations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts/[accountId]/invitations
 * Create a new invitation and send email
 * Requires admin/owner role
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;

    // Verify user is admin/owner of this account
    const { user, account } = await requireAccountAdmin(accountId);

    const supabase = await createClient();

    // Validate request body
    const body = await req.json();
    const validatedInput = CreateInvitationRequestSchema.parse(body);

    // Check seat limit (pending invitations + current members)
    const { currentCount, seatLimit } = await checkSeatLimit(
      accountId,
      supabase
    );

    // Count pending invitations
    const { count: pendingCount } = await supabase
      .from("account_invitations")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId)
      .is("accepted_at", null);

    const totalCommitted = currentCount + (pendingCount || 0);

    if (totalCommitted >= seatLimit) {
      return NextResponse.json(
        {
          error: "Seat limit reached",
          message: `Your team has ${seatLimit} seats. You have ${currentCount} members and ${pendingCount || 0} pending invitations. Please upgrade to add more members.`,
          seatLimit,
          currentMembers: currentCount,
          pendingInvitations: pendingCount || 0,
        },
        { status: 400 }
      );
    }

    // Get inviter's profile for the email
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.name || "A team member";

    // Create the invitation
    const invitation = await createInvitation(
      {
        accountId,
        invitedByUserId: user.id,
        email: validatedInput.email,
        role: validatedInput.role,
      },
      supabase
    );

    // Send the invitation email
    try {
      await sendInvitationEmail({
        email: validatedInput.email,
        accountName: account.name,
        inviterName,
        token: invitation.token,
        role: validatedInput.role,
      });
    } catch (emailError) {
      // If email fails, delete the invitation and return error
      await supabase
        .from("account_invitations")
        .delete()
        .eq("id", invitation.id);

      console.error("Failed to send invitation email:", emailError);
      return NextResponse.json(
        { error: "Failed to send invitation email" },
        { status: 500 }
      );
    }

    // Return invitation (without token for security)
    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
          created_at: invitation.created_at,
        },
        message: `Invitation sent to ${validatedInput.email}`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message.includes("admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message.includes("already pending")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof Error && error.message.includes("already a member")) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Error creating invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
