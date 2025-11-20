import { requireAuth, getUserDefaultAccount } from "@/libs/auth";
import DashboardPaths from "@/components/paths/DashboardPaths";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

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

  // Get paths generated this month
  const supabase = await createClient();
  const currentDate = new Date();
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const { count: pathsThisMonth } = await supabase
    .from('learning_paths')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', defaultAccount.account.id)
    .gte('created_at', firstDayOfMonth.toISOString());

  return (
    <DashboardPaths
      userId={user.id}
      accountId={defaultAccount.account.id}
      subscriptionTier={defaultAccount.account.subscription_tier}
      pathsGeneratedThisCycle={pathsThisMonth || 0}
      accountType={defaultAccount.account.account_type}
      seatCount={defaultAccount.account.seat_count}
    />
  );
}
