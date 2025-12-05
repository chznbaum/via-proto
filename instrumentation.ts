import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Capture nested React Server Component errors (Next.js 15+)
export async function onRequestError(
  error: Error & { digest?: string },
  request: { method: string; path: string; headers: Record<string, string | undefined> },
  context: { routerKind: string; routePath: string; routeType: string; renderSource: string }
) {
  // Report to Sentry using built-in handler
  Sentry.captureRequestError(error, request as Parameters<typeof Sentry.captureRequestError>[1], context);

  // Also report to Axiom for structured logging
  try {
    const { logger } = await import("@/libs/axiom/server");
    logger.error("Request error", {
      error: {
        message: error.message,
        stack: error.stack,
        digest: error.digest,
      },
      request: {
        method: request.method,
        path: request.path,
      },
      context,
    });
    await logger.flush();
  } catch {
    // Axiom logging failure shouldn't break error handling
  }
}
