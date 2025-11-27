import type { Viewport } from "next";
import { ReactNode } from "react";
import ClientLayout from "@/components/LayoutClient";
import { SwetrixAnalytics } from "@/components/SwetrixAnalytics";
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
      {/* Fixel Regular - Primary body font */}
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/fixel/FixelText-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      {/* Fixel SemiBold - Common for emphasis */}
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/fixel/FixelText-SemiBold.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      {/* Young Serif - Headings */}
      <link
        rel="preload"
        href="https://cdn.viapro.to/fonts/young-serif/YoungSerif-Regular.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme={config.colors.theme} className="group/html">
      <head>
        <FontPreloads />
      </head>
      <body>
        {/* ClientLayout contains all the client wrappers (Crisp chat support, toast messages, tooltips, etc.) */}
        <ClientLayout>{children}</ClientLayout>
        <SwetrixAnalytics />
      </body>
    </html>
  );
}
