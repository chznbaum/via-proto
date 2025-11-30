import { type NextRequest, type NextFetchEvent } from "next/server";
import { updateSession } from "@/libs/supabase/middleware";
import { logger } from "@/libs/axiom/server";
import { transformMiddlewareRequest } from "@axiomhq/nextjs";

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  // Log request to Axiom
  logger.info(...transformMiddlewareRequest(request));
  event.waitUntil(logger.flush());

  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
