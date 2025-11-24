import Pricing from "@/components/Pricing";
import { requireAuth } from "@/libs/auth";

export default async function UpgradePage() {
  // Require authentication to access upgrade page
  await requireAuth();

  return (
    <main>
      <Pricing />
    </main>
  );
}
