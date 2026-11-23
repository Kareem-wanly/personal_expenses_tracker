import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

const AUTH_PAGES = ["/login", "/register"];
/** Readable by anyone, signed in or not (app stores link to these). */
const PUBLIC_PAGES = ["/privacy"];

/**
 * Optimistic redirect only (cookie presence, no DB hit). Real authorization
 * happens in the Data Access Layer (`requireUser`) on every read/write.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PAGES.includes(pathname)) return NextResponse.next();
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
    // Skip API, Next internals, PWA assets, static files, the Android app
    // download and Digital Asset Links (Android must read it signed out).
    "/((?!api|_next/static|_next/image|serwist|~offline|manifest.webmanifest|icons|download|\\.well-known|favicon.ico|.*\\.(?:png|svg|ico|webp|jpg|txt|xml|json|apk)$).*)",
  ],
};
