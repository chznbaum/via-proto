import { notFound, redirect } from "next/navigation";
import Stripe from "stripe";
import { requireAuth, getAccountWithRole } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";
import { TeamSettingsClient } from "./TeamSettingsClient";

export const dynamic = "force-dynamic";

// Helper to get subscription pricing info from Stripe
async function getSubscriptionPricing(subscriptionId: string | null) {
  if (!subscriptionId) return null;

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-08-16",
      typescript: true,
    });

    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["items.data.price"],
    });

    const item = subscription.items.data[0];
    if (!item?.price) return null;

    const price = item.price;
    const unitAmount = price.unit_amount || 0;
    const currency = price.currency || "usd";
    const interval = price.recurring?.interval || "month";

    return {
      unitAmount: unitAmount / 100, // Convert from cents
      currency: currency.toUpperCase(),
      interval,
    };
  } catch (error) {
    console.error("Error fetching subscription pricing:", error);
    return null;
  }
}

interface AccountSettingsPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function AccountSettingsPage({
  params,
}: AccountSettingsPageProps) {
  const { accountId } = await params;
  const user = await requireAuth();
  const supabase = await createClient();

  // Verify user is a member of this account
  let accountWithRole;
  try {
    accountWithRole = await getAccountWithRole(user.id, accountId);
  } catch {
    notFound();
  }

  // Only show settings for team accounts
  if (accountWithRole.account.account_type !== "team") {
    redirect("/account");
  }

  // Get members
  const { data: memberships } = await supabase
    .from("account_users")
    .select(
      `
      role,
      created_at,
      profiles!inner (
        id,
        name,
        avatar_url
      )
    `
    )
    .eq("account_id", accountId);

  const members = (memberships || []).map((m: any) => ({
    user_id: m.profiles.id,
    name: m.profiles.name || "Unknown",
    avatar_url: m.profiles.avatar_url,
    role: m.role,
    joined_at: m.created_at,
  }));

  // Get pending invitations
  const { data: invitations } = await supabase
    .from("account_invitations")
    .select("id, email, role, expires_at, created_at")
    .eq("account_id", accountId)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  // Get subscription pricing for owners
  const pricing = accountWithRole.role === "owner"
    ? await getSubscriptionPricing(accountWithRole.account.stripe_subscription_id)
    : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <TeamSettingsClient
        account={accountWithRole.account}
        currentUserId={user.id}
        currentUserRole={accountWithRole.role}
        initialMembers={members}
        initialInvitations={invitations || []}
        pricing={pricing}
      />
    </div>
  );
}
