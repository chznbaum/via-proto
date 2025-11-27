import { ReactNode } from "react";
import { DashboardSidebar } from "@/components/dashboard-layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard-layout/DashboardTopbar";
import { DashboardRightbar } from "@/components/dashboard-layout/DashboardRightbar";
import { DashboardAccountDrawer } from "@/components/dashboard-layout/DashboardAccountDrawer";
import { DashboardFooter } from "@/components/dashboard-layout/DashboardFooter";
import { getDashboardMenuItems } from "./menu";
import { requireAuth } from "@/libs/auth";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protect all dashboard routes
  await requireAuth();

  const menuItems = getDashboardMenuItems();

  return (
    <>
      <div className="size-full">
        <div className="flex">
          <DashboardSidebar menuItems={menuItems} />
          <div className="flex h-screen min-w-0 grow flex-col overflow-auto">
            <DashboardTopbar />
            <div id="layout-content">{children}</div>
            <DashboardFooter />
          </div>
        </div>
        <DashboardRightbar />
      </div>

      {/* Account drawer - separate from main layout */}
      <DashboardAccountDrawer />
    </>
  );
}
