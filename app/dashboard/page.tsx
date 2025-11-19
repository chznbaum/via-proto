import ButtonAccount from "@/components/ButtonAccount";
import { requireAuth, getUserDefaultAccount } from "@/libs/auth";
import DashboardPaths from "@/components/paths/DashboardPaths";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server component which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const user = await requireAuth();
  const defaultAccount = await getUserDefaultAccount(user.id);

  if (!defaultAccount) {
    return (
      <main className="min-h-screen p-8 pb-24">
        <section className="max-w-xl mx-auto space-y-8">
          <div className="alert alert-error">
            <span>No active account found. Please contact support.</span>
          </div>
        </section>
      </main>
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
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div />
          <ButtonAccount />
        </div>

        <DashboardPaths
          userId={user.id}
          accountId={defaultAccount.account.id}
          subscriptionTier={defaultAccount.account.subscription_tier}
          pathsGeneratedThisCycle={pathsThisMonth || 0}
          accountType={defaultAccount.account.account_type}
          seatCount={defaultAccount.account.seat_count}
        />
      </section>
    </main>
  );
}
