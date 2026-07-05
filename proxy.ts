import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js proxy (successor of middleware.ts): refreshes the Supabase
 * auth session and guards protected routes on every matched request.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on everything except static assets and images so auth
     * cookies stay fresh across the app.
     */
    "/((?!_next/static|_next/image|favicon.ico|icons|sw.js|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
