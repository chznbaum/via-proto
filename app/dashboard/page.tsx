import ButtonAccount from "@/components/ButtonAccount";
import { requireAuth, getUserDefaultAccount } from "@/libs/auth";

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Dashboard() {
  const user = await requireAuth();
  const defaultAccount = await getUserDefaultAccount(user.id);

  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-xl mx-auto space-y-8">
        <ButtonAccount />
        <h1 className="text-3xl md:text-4xl font-extrabold">Dashboard</h1>

        {/* Display user info */}
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title">User Information</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
          </div>
        </div>

        {/* Display default account info */}
        {defaultAccount && (
          <div className="card bg-base-200">
            <div className="card-body">
              <h2 className="card-title">Default Account</h2>
              <p><strong>Account Name:</strong> {defaultAccount.account.name}</p>
              <p><strong>Account Type:</strong> {defaultAccount.account.account_type}</p>
              <p><strong>Subscription Tier:</strong> {defaultAccount.account.subscription_tier}</p>
              <p><strong>Your Role:</strong> {defaultAccount.role}</p>
              <p><strong>Paths Generated:</strong> {defaultAccount.account.paths_generated_this_cycle} / {defaultAccount.account.subscription_tier === 'free' ? '1' : '10'}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
