import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/register"];

/**
 * Optimistic redirect only (cookie presence, no DB hit). Real authorization
 * happens in the Data Access Layer (`requireUser`) on every read/write.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = !!getSessionCookie(request);
  const isAuthPage = AUTH_PAGES.includes(pathname);

  if (!hasSession && !isAuthPage) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip API, Next internals, PWA assets and static files.
    "/((?!api|_next/static|_next/image|serwist|~offline|manifest.webmanifest|icons|favicon.ico|.*\\.(?:png|svg|ico|webp|jpg|txt|xml)$).*)",
  ],
};
