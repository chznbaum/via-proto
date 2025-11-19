import Pricing from "@/components/Pricing";
import { requireAuth } from "@/libs/auth";

export default async function PricingPage() {
  // Require authentication to access pricing
  await requireAuth();

  return (
    <main className="min-h-screen">
      <Pricing />
    </main>
  );
}
