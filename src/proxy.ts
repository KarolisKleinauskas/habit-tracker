import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (cookie presence). The real session check happens
// in requireUser() close to the data.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except auth pages, API routes, Next internals and public PWA assets.
    "/((?!api/|_next/|login|register|offline|favicon\\.ico|manifest\\.webmanifest|sw\\.js|icons/|icon|apple-icon|.*\\.(?:png|svg|ico|webp|html)$).*)",
  ],
};
