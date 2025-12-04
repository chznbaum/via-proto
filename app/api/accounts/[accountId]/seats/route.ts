import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import Stripe from "stripe";
import { createClient } from "@/libs/supabase/server";
import { getAccountWithRole } from "@/libs/auth";

const UpdateSeatsSchema = z.object({
  seat_count: z.number().int().min(2, "Minimum seat count is 2"),
});

/**
 * PATCH /api/accounts/[accountId]/seats
 * Update the seat count for a team account
 * Requires owner role
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

    // 2. Verify ownership
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
        { error: "Only the owner can change seat count" },
        { status: 403 }
      );
    }

    // 3. Validate input
    const body = await req.json();
    const { seat_count: newSeatCount } = UpdateSeatsSchema.parse(body);

    // 4. Get current usage (members + pending invitations)
    const { count: memberCount } = await supabase
      .from("account_users")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId);

    const { count: invitationCount } = await supabase
      .from("account_invitations")
      .select("*", { count: "exact", head: true })
      .eq("account_id", accountId)
      .is("accepted_at", null);

    const currentUsage = (memberCount || 0) + (invitationCount || 0);

    if (newSeatCount < currentUsage) {
      return NextResponse.json(
        {
          error: `Cannot reduce below ${currentUsage} seats (currently in use)`,
        },
        { status: 400 }
      );
    }

    // 5. Get the account's Stripe subscription
    const { data: account } = await supabase
      .from("accounts")
      .select("stripe_subscription_id, seat_count")
      .eq("id", accountId)
      .single();

    if (!account?.stripe_subscription_id) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // 6. Update Stripe subscription quantity
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-08-16",
      typescript: true,
    });

    // Get the subscription to find the item ID
    const subscription = await stripe.subscriptions.retrieve(
      account.stripe_subscription_id
    );

    if (!subscription.items.data[0]) {
      return NextResponse.json(
        { error: "Subscription item not found" },
        { status: 400 }
      );
    }

    // Update the subscription quantity
    await stripe.subscriptions.update(account.stripe_subscription_id, {
      items: [
        {
          id: subscription.items.data[0].id,
          quantity: newSeatCount,
        },
      ],
      proration_behavior: "create_prorations", // Prorate the change
    });

    // 7. Update the database
    const { error: updateError } = await supabase
      .from("accounts")
      .update({ seat_count: newSeatCount })
      .eq("id", accountId);

    if (updateError) {
      console.error("Error updating seat count in database:", updateError);
      // Note: Stripe was already updated, so we should still return success
      // The webhook will eventually sync the data
    }

    return NextResponse.json({
      success: true,
      seat_count: newSeatCount,
      message: `Seat count updated to ${newSeatCount}`,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error updating seat count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
