import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/expenses",
  "/income",
  "/transactions",
  "/categories",
  "/budgets",
  "/analytics",
  "/reports",
  "/settings",
  "/profile",
];

const AUTH_PAGES = ["/login", "/register", "/forgot-password"];

/**
 * Refreshes the Supabase session on every request and enforces
 * protected routes. Runs inside the Next.js proxy (edge).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add logic between client creation and getUser() —
  // the call refreshes expired tokens and rewrites cookies.
  let user = null;
  try {
    ({
      data: { user },
    } = await supabase.auth.getUser());
  } catch {
    // A revoked refresh token must sign the visitor out, not take the
    // whole request down. Drop the dead auth cookies so every later
    // request doesn't retry the doomed refresh.
    response = NextResponse.next({ request });
    for (const { name } of request.cookies.getAll()) {
      if (name.startsWith("sb-")) response.cookies.delete(name);
    }
  }

  // Redirects must carry the cookie changes getUser() queued on the
  // pass-through response (token refresh or dead-session cleanup).
  const withAuthCookies = (redirect: NextResponse) => {
    for (const cookie of response.cookies.getAll()) {
      redirect.cookies.set(cookie);
    }
    return redirect;
  };

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return withAuthCookies(NextResponse.redirect(url));
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return withAuthCookies(NextResponse.redirect(url));
  }

  return response;
}
