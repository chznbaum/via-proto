import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";
import { UpdateAccountRequestSchema } from "@/libs/validation/team-schema";

/**
 * GET /api/accounts/[accountId]
 * Get account details
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

    // 2. Verify membership and get account
    let accountWithRole;
    try {
      accountWithRole = await getAccountWithRole(user.id, accountId);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      account: accountWithRole.account,
      role: accountWithRole.role,
    });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/accounts/[accountId]
 * Update account (name, complete setup)
 * Requires owner or admin role
 */
export async function PATCH(
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

    // 2. Verify membership and check role
    let accountWithRole;
    try {
      accountWithRole = await getAccountWithRole(user.id, accountId);
    } catch {
      return NextResponse.json(
        { error: "You are not a member of this account" },
        { status: 403 }
      );
    }

    // Only owners and admins can update account settings
    if (!["owner", "admin"].includes(accountWithRole.role)) {
      return NextResponse.json(
        { error: "You don't have permission to update this account" },
        { status: 403 }
      );
    }

    // 3. Validate input
    const body = await req.json();
    const validatedInput = UpdateAccountRequestSchema.parse(body);

    // 4. Build update object
    const updateData: Record<string, unknown> = {};

    if (validatedInput.name !== undefined) {
      updateData.name = validatedInput.name;
    }

    if (validatedInput.needs_setup === false) {
      updateData.needs_setup = false;
      updateData.setup_completed_at = new Date().toISOString();
    }

    // 5. Update account
    const { data: updatedAccount, error: updateError } = await supabase
      .from("accounts")
      .update(updateData)
      .eq("id", accountId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating account:", updateError);
      return NextResponse.json(
        { error: "Failed to update account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      account: updatedAccount,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
