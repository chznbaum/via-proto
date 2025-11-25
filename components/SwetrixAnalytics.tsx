"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    swetrix?: {
      init: (projectId: string, options?: { apiURL?: string }) => void;
      trackViews: (options?: { search?: boolean }) => void;
      pageview: (options: { pg: string; prev?: string }) => void;
    };
  }
}

function SwetrixPageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    // Skip initial mount - trackViews() handles the first pageview
    if (prevPathRef.current === null) {
      prevPathRef.current = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      return;
    }

    const currentPath = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

    // Only track if path actually changed
    if (window.swetrix && currentPath !== prevPathRef.current) {
      window.swetrix.pageview({
        pg: currentPath,
        prev: prevPathRef.current,
      });
      prevPathRef.current = currentPath;
    }
  }, [pathname, searchParams]);

  return null;
}

export const SwetrixAnalytics = () => {
  return (
    <>
      <Script
        src="https://swetrix.org/swetrix.js"
        strategy="afterInteractive"
        onLoad={() => {
          window.swetrix?.init("8v56UDklPmgM", {
            apiURL: "https://api.analytics.chazona.dev/log",
          });
          window.swetrix?.trackViews({ search: true });
        }}
      />
      <Suspense fallback={null}>
        <SwetrixPageViewTracker />
      </Suspense>
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
