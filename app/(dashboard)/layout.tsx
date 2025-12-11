import type { Viewport } from "next";
import { ReactNode, Suspense } from "react";
import ClientLayout from "@/components/LayoutClient";
import { SwetrixAnalytics } from "@/components/SwetrixAnalytics";
import { DashboardSidebar } from "@/components/dashboard-layout/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard-layout/DashboardTopbar";
import { DashboardRightbar } from "@/components/dashboard-layout/DashboardRightbar";
import { DashboardAccountDrawer } from "@/components/dashboard-layout/DashboardAccountDrawer";
import { DashboardFooter } from "@/components/dashboard-layout/DashboardFooter";
import { UpgradeProcessingModal } from "@/components/dashboard-layout/UpgradeProcessingModal";
import { getDashboardMenuItems } from "./menu";
import { requireAuth } from "@/libs/auth";
import config from "@/config";
import { baseMetadata } from "@/libs/seo";
import "../styles/app.css";

export const viewport: Viewport = {
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

export const metadata = baseMetadata;

// Preload critical fonts to prevent FOUT (Flash of Unstyled Text)
function FontPreloads() {
  return (
    <>
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/fixel/FixelText-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/fixel/FixelText-SemiBold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/young-serif/YoungSerif-Light.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/young-serif/YoungSerif-Medium.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Protect all dashboard routes
  await requireAuth();

  const menuItems = getDashboardMenuItems();

  return (
    <html lang="en" data-theme={config.colors.theme} className="group/html">
      <head>
        <FontPreloads />
      </head>
      <body>
        <ClientLayout>
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
          <DashboardAccountDrawer />
          <Suspense fallback={null}>
            <UpgradeProcessingModal />
          </Suspense>
        </ClientLayout>
        <SwetrixAnalytics />
      </body>
    </html>
  );
}
