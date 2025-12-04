import { requireAuth, getUserDefaultAccount } from "@/libs/auth";
import DashboardPaths from "@/components/paths/DashboardPaths";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

interface AccountWithUsage {
  id: string;
  name: string;
  account_type: "personal" | "team";
  subscription_tier: string;
  seat_count: number;
  paths_this_month: number;
}

export default async function DashboardPage() {
  const user = await requireAuth();
  const defaultAccount = await getUserDefaultAccount(user.id);

  if (!defaultAccount) {
    return (
      <div className="alert alert-error">
        <span>No active account found. Please contact support.</span>
      </div>
    );
  }

  const supabase = await createClient();
  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  // Get all user's accounts
  const { data: memberships } = await supabase
    .from("account_users")
    .select("account_id")
    .eq("user_id", user.id);

  let allAccounts: AccountWithUsage[] = [];

  if (memberships && memberships.length > 0) {
    const accountIds = memberships.map((m) => m.account_id);

    // Fetch account details
    const { data: accountsData } = await supabase
      .from("accounts")
      .select("id, name, account_type, subscription_tier, seat_count")
      .in("id", accountIds);

    if (accountsData) {
      // Get paths count for each account this month
      const accountsWithUsage = await Promise.all(
        accountsData.map(async (account) => {
          const { count } = await supabase
            .from("learning_paths")
            .select("*", { count: "exact", head: true })
            .eq("account_id", account.id)
            .gte("created_at", firstDayOfMonth.toISOString());

          return {
            ...account,
            paths_this_month: count || 0,
          } as AccountWithUsage;
        })
      );

      allAccounts = accountsWithUsage;
    }
  }

  // Get paths count for default account (for backward compatibility)
  const { count: pathsThisMonth } = await supabase
    .from("learning_paths")
    .select("*", { count: "exact", head: true })
    .eq("account_id", defaultAccount.account.id)
    .gte("created_at", firstDayOfMonth.toISOString());

  return (
    <DashboardPaths
      userId={user.id}
      accountId={defaultAccount.account.id}
      subscriptionTier={defaultAccount.account.subscription_tier}
      pathsGeneratedThisCycle={pathsThisMonth || 0}
      accountType={defaultAccount.account.account_type}
      seatCount={defaultAccount.account.seat_count}
      accounts={allAccounts}
    />
  );
}
