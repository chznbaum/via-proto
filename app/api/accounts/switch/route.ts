import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";
import { SwitchAccountRequestSchema } from "@/libs/validation/team-schema";

/**
 * POST /api/accounts/switch
 * Switch the user's default account
 * Updates profiles.default_account_id
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
    const { account_id } = SwitchAccountRequestSchema.parse(body);

    // 3. Verify user is a member of the target account
    let accountWithRole;
    try {
      accountWithRole = await getAccountWithRole(user.id, account_id);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    // 4. Update user's default_account_id
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ default_account_id: account_id })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error switching account:", updateError);
      return NextResponse.json(
        { error: "Failed to switch account" },
        { status: 500 }
      );
    }

    // 5. Return success with account details
    return NextResponse.json({
      success: true,
      account: {
        id: accountWithRole.account.id,
        name: accountWithRole.account.name,
        account_type: accountWithRole.account.account_type,
        subscription_tier: accountWithRole.account.subscription_tier,
      },
      role: accountWithRole.role,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error switching account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
