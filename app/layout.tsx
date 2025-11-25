import type { Viewport } from "next";
import { ReactNode } from "react";
import ClientLayout from "@/components/LayoutClient";
import { SwetrixAnalytics } from "@/components/SwetrixAnalytics";
import config from "@/config";
import { baseMetadata } from "@/libs/seo";
import "./styles/app.css";

export const viewport: Viewport = {
  themeColor: config.colors.main,
  width: "device-width",
  initialScale: 1,
};

export const metadata = baseMetadata;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className="group/html">
      <body>
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <ClientLayout>{children}</ClientLayout>
        <SwetrixAnalytics />
      </body>
    </html>
  );
}
