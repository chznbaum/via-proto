"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    swetrix?: {
      init: (projectId: string, options?: { apiURL?: string }) => void;
      trackViews: (options?: { search?: boolean }) => void;
      trackErrors: (options?: { sampleRate?: number }) => void;
      pageview: (options: { pg: string; prev?: string }) => void;
      track: (options: {
        ev: string;
        unique?: boolean;
        meta?: Record<string, string | number | boolean | null>;
      }) => void;
    };
  }
}

/**
 * Track a custom event in Swetrix
 * @param event - Event name (letters, numbers, underscores, dots only; max 64 chars; must start with letter)
 * @param options - Optional settings
 * @param options.unique - If true, only counts once per session (default: false)
 * @param options.meta - Additional metadata (max 20 keys, 1000 chars total)
 *
 * @example
 * trackEvent("cta.hero.get_started")
 * trackEvent("cta.pricing.upgrade", { unique: true })
 * trackEvent("cta.signup", { meta: { source: "header" } })
 */
export function trackEvent(
  event: string,
  options?: {
    unique?: boolean;
    meta?: Record<string, string | number | boolean | null>;
  }
) {
  window.swetrix?.track({
    ev: event,
    unique: options?.unique,
    meta: options?.meta,
  });
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
          window.swetrix?.trackErrors({ sampleRate: 1 });
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
