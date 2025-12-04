import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { createPersonalAccount, userHasProfile } from "@/libs/accounts";
import { addUserToAccount } from "@/libs/teams";
import { AcceptInvitationRequestSchema } from "@/libs/validation/team-schema";

/**
 * POST /api/invitations/accept
 * Accept a team invitation using the token from the email
 * Creates personal account for new users if needed
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Validate input
    const body = await req.json();
    const { token } = AcceptInvitationRequestSchema.parse(body);

    // 3. Use service role to access invitation (bypasses RLS for token lookup)
    const serviceSupabase = new SupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 4. Find the invitation
    const { data: invitation, error: invitationError } = await serviceSupabase
      .from("account_invitations")
      .select(
        `
        id,
        account_id,
        email,
        role,
        token,
        expires_at,
        accepted_at,
        account:accounts(id, name)
      `
      )
      .eq("token", token)
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json(
        { error: "Invalid invitation token" },
        { status: 400 }
      );
    }

    // 5. Validate invitation state
    if (invitation.accepted_at) {
      return NextResponse.json(
        { error: "This invitation has already been accepted" },
        { status: 400 }
      );
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This invitation has expired" },
        { status: 400 }
      );
    }

    // 6. Check if user is already a member
    const { data: existingMembership } = await serviceSupabase
      .from("account_users")
      .select("id")
      .eq("account_id", invitation.account_id)
      .eq("user_id", user.id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: "You are already a member of this team" },
        { status: 400 }
      );
    }

    // 7. Ensure user has a profile (create personal account if needed)
    const hasProfile = await userHasProfile(user.id, serviceSupabase);

    if (!hasProfile) {
      // New user accepting invitation - create their personal account
      await createPersonalAccount(
        user.id,
        user.email!,
        user.user_metadata?.name || null,
        serviceSupabase,
        user.user_metadata?.avatar_url || null
      );
    }

    // 8. Add user to team account
    await addUserToAccount(
      user.id,
      invitation.account_id,
      invitation.role as "admin" | "member",
      serviceSupabase
    );

    // 9. Mark invitation as accepted
    await serviceSupabase
      .from("account_invitations")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_by_user_id: user.id,
      })
      .eq("id", invitation.id);

    // 10. Return success with account info
    // Handle both array and object forms from Supabase relational query
    const accountData = invitation.account;
    const accountInfo = Array.isArray(accountData) ? accountData[0] : accountData;

    return NextResponse.json({
      success: true,
      account: {
        id: accountInfo.id,
        name: accountInfo.name,
      },
      role: invitation.role,
      message: `You've joined ${accountInfo.name}!`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error accepting invitation:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
