"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    swetrix?: {
      init: (projectId: string, options?: { apiURL?: string }) => void;
      trackViews: () => void;
      pageview: (options?: { payload?: Record<string, string> }) => void;
    };
  }
}

export const SwetrixAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views on route changes (after initial load)
    if (window.swetrix) {
      window.swetrix.trackViews();
    }
  }, [pathname, searchParams]);

  return (
    <>
      <Script
        src="https://swetrix.org/swetrix.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.swetrix?.init("8v56UDklPmgM", {
            apiURL: "https://api.analytics.chazona.dev/log",
          });
          window.swetrix?.trackViews();
        }}
      />
      <noscript>
        <img
          src="https://api.analytics.chazona.dev/log/noscript?pid=8v56UDklPmgM"
          alt=""
          referrerPolicy="no-referrer-when-downgrade"
        />
      </noscript>
    </>
  );
};
