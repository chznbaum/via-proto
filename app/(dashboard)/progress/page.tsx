import { requireAuth } from "@/libs/auth";
import { ProgressDashboard } from "@/components/progress/ProgressDashboard";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const user = await requireAuth();

  return <ProgressDashboard userId={user.id} />;
}
