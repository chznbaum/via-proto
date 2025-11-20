import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard-layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard-layout/DashboardTopbar";
import { dashboardMenuItems } from "./menu";
import { requireAuth } from "@/libs/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protect all dashboard routes
  await requireAuth();

  return (
    <div className="drawer lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />

      {/* Main content */}
      <div className="drawer-content flex flex-col">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto bg-base-200/30">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar */}
      <DashboardSidebar menuItems={dashboardMenuItems} />
    </div>
  );
}
