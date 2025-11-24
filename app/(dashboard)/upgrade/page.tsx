import Pricing from "@/components/Pricing";
import { requireAuth } from "@/libs/auth";

export default async function UpgradePage() {
  // Require authentication to access upgrade page
  await requireAuth();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Upgrade Your Plan</h1>
        <p className="text-base-content/70 mt-2">
          Choose a plan that fits your learning journey
        </p>
      </div>
      <Pricing />
    </main>
  );
}
