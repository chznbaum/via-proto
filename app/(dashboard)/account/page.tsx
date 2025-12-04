import Link from "next/link";
import { requireAuth } from "@/libs/auth";
import { createClient } from "@/libs/supabase/server";

export const dynamic = "force-dynamic";

interface AccountWithRole {
  id: string;
  name: string;
  account_type: "personal" | "team";
  subscription_tier: string;
  seat_count: number | null;
  role: string;
}

export default async function AccountPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  // Get all accounts the user belongs to
  const { data: memberships } = await supabase
    .from("account_users")
    .select(
      `
      role,
      accounts!inner (
        id,
        name,
        account_type,
        subscription_tier,
        seat_count
      )
    `
    )
    .eq("user_id", user.id);

  const accounts: AccountWithRole[] = (memberships || []).map((m: any) => ({
    id: m.accounts.id,
    name: m.accounts.name,
    account_type: m.accounts.account_type,
    subscription_tier: m.accounts.subscription_tier,
    seat_count: m.accounts.seat_count,
    role: m.role,
  }));

  const personalAccount = accounts.find((a) => a.account_type === "personal");
  const teamAccounts = accounts.filter((a) => a.account_type === "team");

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Account Settings</h1>
      <p className="text-base-content/70 mb-8">
        Manage your personal and team accounts
      </p>

      {/* Personal Account */}
      {personalAccount && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Personal Account</h2>
          <div className="card card-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="avatar placeholder">
                  <div className="w-12 rounded-full bg-primary text-primary-content flex items-center justify-center">
                    <span className="text-lg">
                      {personalAccount.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">{personalAccount.name}</p>
                  <p className="text-sm text-base-content/60">
                    {personalAccount.subscription_tier.charAt(0).toUpperCase() +
                      personalAccount.subscription_tier.slice(1)}{" "}
                    Plan
                  </p>
                </div>
              </div>
              <div className="badge badge-outline">Personal</div>
            </div>
          </div>
        </div>
      )}

      {/* Team Accounts */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Team Accounts</h2>
        {teamAccounts.length === 0 ? (
          <div className="card card-border p-6 text-center">
            <span className="iconify lucide--users size-12 text-base-content/30 mx-auto mb-4" />
            <p className="text-base-content/70 mb-4">
              You&apos;re not part of any team accounts yet.
            </p>
            <Link href="/upgrade" className="btn btn-primary btn-sm">
              Create a Team
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {teamAccounts.map((account) => (
              <Link
                key={account.id}
                href={`/account/${account.id}`}
                className="card card-border p-6 hover:border-primary transition-colors block"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="avatar placeholder">
                      <div className="w-12 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                        <span className="iconify lucide--users size-6" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-sm text-base-content/60">
                        {account.subscription_tier.charAt(0).toUpperCase() +
                          account.subscription_tier.slice(1)}{" "}
                        Plan
                        {account.seat_count && ` · ${account.seat_count} seats`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="badge badge-outline capitalize">
                      {account.role}
                    </div>
                    <span className="iconify lucide--chevron-right size-5 text-base-content/40" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
