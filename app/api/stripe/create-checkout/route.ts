import { createCheckout } from "@/libs/stripe";
import { createClient } from "@/libs/supabase/server";
import { getUserDefaultAccount } from "@/libs/auth";
import config from "@/config";
import { NextRequest, NextResponse } from "next/server";

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It's called by the <ButtonCheckout /> component
// Users must be authenticated. It will prefill the Checkout data with their email and/or credit card (if any)
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.priceId) {
    return NextResponse.json(
      { error: "Price ID is required" },
      { status: 400 }
    );
  } else if (!body.successUrl || !body.cancelUrl) {
    return NextResponse.json(
      { error: "Success and cancel URLs are required" },
      { status: 400 }
    );
  } else if (!body.mode) {
    return NextResponse.json(
      {
        error:
          "Mode is required (either 'payment' for one-time payments or 'subscription' for recurring subscription)",
      },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { priceId, mode, successUrl, cancelUrl, seatCount } = body;

    // Get user's default account
    const accountData = await getUserDefaultAccount(user.id);

    if (!accountData) {
      return NextResponse.json(
        { error: "No active account found" },
        { status: 400 }
      );
    }

    const { account } = accountData;

    // Find the plan configuration
    const plan = config.stripe.plans.find((p) => p.priceId === priceId);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid price ID" },
        { status: 400 }
      );
    }

    // For Team plans, validate seat count
    let quantity = 1;
    if (plan.perSeat) {
      if (!seatCount || seatCount < (plan.minSeats || 2)) {
        return NextResponse.json(
          { error: `Team plan requires at least ${plan.minSeats || 2} seats` },
          { status: 400 }
        );
      }
      quantity = seatCount;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .single();

    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      // Pass account_id in metadata so webhook knows which account to update
      clientReferenceId: account.id,
      user: {
        email: profile?.email,
        // Use account-level customer ID
        customerId: account.stripe_customer_id,
      },
      // For Team plans, pass the seat count as quantity
      ...(plan.perSeat && { quantity }),
      // Pass metadata for webhook processing
      metadata: {
        account_id: account.id,
        user_id: user.id,
        tier: plan.tier,
        seat_count: quantity.toString(),
      },
      // If you send coupons from the frontend, you can pass it here
      // couponId: body.couponId,
    });

    return NextResponse.json({ url: stripeSessionURL });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
