export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = async (
  error: Error & { digest?: string },
  request: {
    method: string;
    path: string;
    headers: Record<string, string>;
  },
  context: { routerKind: string; routeType: string; routePath: string }
) => {
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureException(error, {
    extra: {
      request,
      context,
    },
  });
};
