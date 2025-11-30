import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,

  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extension errors
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors that aren't actionable
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // User aborted requests
    "AbortError",
    // Resize observer errors (browser quirk)
    "ResizeObserver loop",
  ],

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",
});

// Export for Next.js App Router navigation tracking
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
