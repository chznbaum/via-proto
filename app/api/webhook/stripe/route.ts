import configFile from "@/config";
import { findCheckoutSession } from "@/libs/stripe";
import { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createTeamAccount } from "@/libs/teams";
import { createPersonalAccount, userHasProfile } from "@/libs/accounts";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-08-16",
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req: NextRequest) {
  const body = await req.text();

  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  let eventType;
  let event;

  // Create a private supabase client using the secret service_role API key
  const supabase = new SupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // verify Stripe event is legit
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed. ${err.message}`);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  eventType = event.type;

  try {
    switch (eventType) {
      case "checkout.session.completed": {
        // First payment is successful and a subscription is created (if mode was set to "subscription" in ButtonCheckout)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Checkout.Session = event.data
          .object as Stripe.Checkout.Session;

        const session = await findCheckoutSession(stripeObject.id);

        const customerId = session?.customer as string;
        const priceId = session?.line_items?.data[0]?.price.id;
        const quantity = session?.line_items?.data[0]?.quantity || 1;
        const clientRefId = stripeObject.client_reference_id;
        const metadata = stripeObject.metadata || {};
        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        if (!plan || !clientRefId) {
          console.error('Missing plan or client_reference_id in checkout session');
          break;
        }

        // Get the subscription ID if it's a subscription
        const subscriptionId = session?.subscription as string | null;

        // Check if this is a team signup (new team account creation)
        if (clientRefId.startsWith('team_signup:') || metadata.checkout_type === 'team_signup') {
          const userId = metadata.user_id || clientRefId.split(':')[1];

          if (!userId) {
            console.error('Missing user_id for team signup');
            break;
          }

          // 1. Ensure user has a personal account (should exist from signup, but create if not)
          const hasProfile = await userHasProfile(userId, supabase);

          if (!hasProfile) {
            // Get user email from Stripe customer
            const customer = await stripe.customers.retrieve(customerId);
            const customerEmail = 'email' in customer ? customer.email : null;

            if (customerEmail) {
              console.log(`Creating personal account for user ${userId} during team signup`);
              await createPersonalAccount(
                userId,
                customerEmail,
                null, // name will be updated later
                supabase
              );
            } else {
              console.error('Cannot create personal account: no email found');
              break;
            }
          }

          // 2. Create the team account
          console.log(`Creating team account for user ${userId} with ${quantity} seats`);
          const teamAccount = await createTeamAccount(
            {
              userId,
              name: 'My Team', // Default name, user will rename in setup wizard
              seatCount: quantity,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId || undefined,
              needsSetup: true, // Triggers welcome dialog in dashboard
            },
            supabase
          );

          console.log(`Team account created: ${teamAccount.id}`);
        } else {
          // Standard account upgrade (pro plan or existing team upgrade)
          const accountId = clientRefId;

          // Update account with subscription details
          await supabase
            .from("accounts")
            .update({
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              subscription_tier: plan.tier,
              subscription_status: 'active',
              seat_count: quantity,
              cycle_start_date: new Date().toISOString(),
              paths_generated_this_cycle: 0, // Reset counter on new subscription
            })
            .eq("id", accountId);
        }

        // Extra: send email with user link, product page, etc...
        // try {
        //   await sendEmail(...);
        // } catch (e) {
        //   console.error("Email issue:" + e?.message);
        // }

        break;
      }

      case "checkout.session.expired": {
        // User didn't complete the transaction
        // You don't need to do anything here, by you can send an email to the user to remind him to complete the transaction, for instance
        break;
      }

      case "customer.subscription.updated": {
        // The customer might have changed the plan (higher or lower plan, cancel soon etc...)
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;

        const priceId = stripeObject.items.data[0]?.price.id;
        const quantity = stripeObject.items.data[0]?.quantity || 1;
        const customerId = stripeObject.customer as string;

        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);

        if (!plan) break;

        // Check if subscription is being canceled (cancel_at_period_end = true)
        const status = stripeObject.cancel_at_period_end
          ? 'canceled'
          : stripeObject.status === 'active'
            ? 'active'
            : stripeObject.status;

        // Update account with new plan details
        await supabase
          .from("accounts")
          .update({
            subscription_tier: plan.tier,
            subscription_status: status,
            seat_count: quantity,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "customer.subscription.deleted": {
        // The customer subscription stopped
        // ❌ Revoke access to the product (revert to free tier)
        const stripeObject: Stripe.Subscription = event.data
          .object as Stripe.Subscription;
        const subscription = await stripe.subscriptions.retrieve(
          stripeObject.id
        );

        // Revert account to free tier
        await supabase
          .from("accounts")
          .update({
            subscription_tier: 'free',
            subscription_status: 'inactive',
            stripe_subscription_id: null,
            seat_count: 1, // Personal accounts always have 1 seat
          })
          .eq("stripe_customer_id", subscription.customer);
        break;
      }

      case "invoice.paid": {
        // Customer just paid an invoice (for instance, a recurring payment for a subscription)
        // ✅ Grant access to the product
        const stripeObject: Stripe.Invoice = event.data
          .object as Stripe.Invoice;
        const priceId = stripeObject.lines.data[0].price.id;
        const quantity = stripeObject.lines.data[0].quantity || 1;
        const customerId = stripeObject.customer;

        // Find account where customer_id equals the customerId
        const { data: account } = await supabase
          .from("accounts")
          .select("*")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!account) break;

        const plan = configFile.stripe.plans.find((p) => p.priceId === priceId);
        if (!plan) break;

        // Update account subscription status to active (renewal successful)
        await supabase
          .from("accounts")
          .update({
            subscription_tier: plan.tier,
            subscription_status: 'active',
            seat_count: quantity,
          })
          .eq("stripe_customer_id", customerId);

        break;
      }

      case "invoice.payment_failed":
        // A payment failed (for instance the customer does not have a valid payment method)
        // ❌ Revoke access to the product
        // ⏳ OR wait for the customer to pay (more friendly):
        //      - Stripe will automatically email the customer (Smart Retries)
        //      - We will receive a "customer.subscription.deleted" when all retries were made and the subscription has expired

        break;

      default:
      // Unhandled event type
    }
  } catch (e) {
    console.error("stripe error: ", e.message);
  }

  return NextResponse.json({});
}
